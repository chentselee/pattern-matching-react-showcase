import {
  useEffectReducer,
  EffectReducer,
  EffectsMap,
  EffectEntity,
} from "use-effect-reducer";
import { match, __ } from "ts-pattern";
import { mfaInit, mfaStatus } from "./server";

export enum Status {
  unauthorized = "unauthorized",
  authorizing = "authorizing",
  polling = "polling",
  authorized = "authorized",
}

interface Context {
  firebaseToken: string;
  mfaToken: string;
  pollingEffect?: EffectEntity<ReducerState, ReducerEvent>;
}

interface ReducerState {
  status: Status;
  context: Context;
}

const initialState: ReducerState = {
  status: Status.unauthorized,
  context: {
    firebaseToken: "",
    mfaToken: "",
  },
};

type ReducerEvent =
  | { type: "CANCEL" }
  | { type: "MFA_INIT" }
  | { type: "MFA_INIT_SUCCESS"; mfaToken: Context["mfaToken"] }
  | { type: "MFA_POLLING" }
  | { type: "MFA_POLLING_SUCCESS"; firebaseToken: Context["firebaseToken"] };

type ReducerEffect = { type: "mfaInit" } | { type: "mfaPolling" };

const effectsMap: EffectsMap<ReducerState, ReducerEvent, ReducerEffect> = {
  mfaInit: (_, __, dispatch) => {
    (async () => {
      const { mfaToken } = await mfaInit();
      dispatch({ type: "MFA_INIT_SUCCESS", mfaToken });
    })();
  },
  mfaPolling: (_, __, dispatch) => {
    const pollingIntervalId = setInterval(async () => {
      const { status, firebaseToken } = await mfaStatus();
      if (status === 204) {
        dispatch({ type: "MFA_POLLING" });
      } else if (status === 200 && firebaseToken) {
        dispatch({ type: "MFA_POLLING_SUCCESS", firebaseToken });
      }
    }, 1000);

    return () => {
      clearInterval(pollingIntervalId);
    };
  },
};

const reducer: EffectReducer<ReducerState, ReducerEvent, ReducerEffect> = (
  state,
  event,
  exec
) => {
  return match<[ReducerState, ReducerEvent], ReducerState>([state, event])
    .with([{ status: __ }, { type: "CANCEL" }], ([state]) => {
      const { pollingEffect } = state.context;
      pollingEffect && exec.stop(pollingEffect);
      return initialState;
    })
    .with(
      [{ status: Status.unauthorized }, { type: "MFA_INIT" }],
      ([state]) => {
        exec({ type: "mfaInit" });
        return { ...state, status: Status.authorizing };
      }
    )
    .with(
      [{ status: Status.authorizing }, { type: "MFA_INIT_SUCCESS" }],
      ([state, { mfaToken }]) => {
        return {
          ...state,
          context: {
            ...state.context,
            mfaToken,
            pollingEffect: exec({ type: "mfaPolling" }),
          },
        };
      }
    )
    .with(
      [{ status: Status.authorizing }, { type: "MFA_POLLING" }],
      ([state]) => {
        return { ...state, status: Status.polling };
      }
    )
    .with(
      [{ status: Status.polling }, { type: "MFA_POLLING_SUCCESS" }],
      ([state, { firebaseToken }]) => {
        const { pollingEffect } = state.context;
        pollingEffect && exec.stop(pollingEffect);
        return {
          ...state,
          status: Status.authorized,
          context: {
            ...state.context,
            firebaseToken,
            pollingEffect: undefined,
          },
        };
      }
    )
    .otherwise(() => state);
};

export const useMFA = () => {
  const [{ status, context }, dispatch] = useEffectReducer(
    reducer,
    initialState,
    effectsMap
  );
  return { status, context, dispatch };
};
