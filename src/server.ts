export const mfaInit = () =>
  new Promise<{ status: number; mfaToken: string }>((resolve) =>
    setTimeout(() => resolve({ status: 200, mfaToken: "123" }), 1000)
  );

let pollingCount = 0;

export const mfaStatus = () =>
  new Promise<{ status: number; firebaseToken?: string }>((resolve) => {
    if (pollingCount === 5) {
      resolve({ status: 200, firebaseToken: "456" });
      pollingCount = 0;
    } else {
      resolve({ status: 204 });
      pollingCount += 1;
    }
  });
