import React from "react";
import classNames from "classnames";
import { useMFA, Status } from "./mfa";

const statusClasses: Record<Status, string> = {
  [Status.unauthorized]: "text-blue-500",
  [Status.authorizing]: "text-blue-300",
  [Status.polling]: "text-blue-300",
  [Status.authorized]: "text-green-500 border-b-2 border-green-500",
};

export default function App() {
  const { status, context, dispatch } = useMFA();
  return (
    <main className="prose flex flex-col items-center space-y-10 p-10 min-w-full min-h-screen">
      <header className="space-y-1">
        <h1 style={{ marginBlockEnd: 0 }}>
          <span className="text-green-600">Pattern matching</span> for React
        </h1>
        <h5 className="text-right">
          with{" "}
          <a href="https://github.com/davidkpiano/useEffectReducer">
            useEffectReducer
          </a>{" "}
          and <a href="https://github.com/gvergnaud/ts-pattern">ts-pattern</a>
        </h5>
      </header>
      <section className="mt-20">
        <div className={classNames("font-bold text-xl", statusClasses[status])}>
          {status}
        </div>
      </section>
      <section className="space-x-4">
        <button
          className="uppercase font-bold px-5 py-2 bg-green-500 rounded text-white"
          onClick={() => dispatch({ type: "MFA_INIT" })}
        >
          authorize
        </button>
        <button
          className="uppercase font-bold px-5 py-2 bg-gray-500 rounded text-white"
          onClick={() => dispatch({ type: "CANCEL" })}
        >
          cancel
        </button>
      </section>
      <section>
        <pre className="text-left">{JSON.stringify(context, null, 2)}</pre>
      </section>
    </main>
  );
}
