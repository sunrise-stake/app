import { toSol, type Details } from "@sunrisestake/client";
import { useCallback, useState, type FC } from "react";
import { Button, LockForm, Panel, Spinner } from "../../common/components";
import {
  NotificationType,
  notifyTransaction,
} from "../../common/components/notifications";
import { useSunriseStake } from "../../common/context/sunriseStakeContext";
import { type SunriseClientWrapper } from "../../common/sunriseClientWrapper";
import { solToLamports, toFixedWithPrecision } from "../../common/utils";

const LockingApp: FC = () => {
  const {
    client,
    details,
  }: {
    client: SunriseClientWrapper | undefined;
    details: Details | undefined;
  } = useSunriseStake();

  const [isBusy, setIsBusy] = useState(false);
  const [needsUpdate] = useState(() => {
    if (!details?.lockDetails) return false;
    return (
      details.lockDetails.updatedToEpoch.toNumber() < details.currentEpoch.epoch
    );
  });

  const handleError = useCallback((error: Error) => {
    notifyTransaction({
      type: NotificationType.error,
      message: "Transaction failed",
      description: error.message,
    });
    console.error(error);
  }, []);

  const lock = useCallback(
    async (amount: string) => {
      if (!client) return Promise.reject(new Error("Client not initialized"));
      await client.lockGSol(solToLamports(amount));
    },
    [client]
  );

  const unlock = useCallback(async () => {
    if (!client) return Promise.reject(new Error("Client not initialized"));
    return client
      .unlockGSol()
      .then((tx) => {
        notifyTransaction({
          type: NotificationType.success,
          message: "Deposit successful",
          txid: tx,
        });
      })
      .catch(handleError);
  }, [client]);

  return (
    <div className="container mx-auto flex flex-col justify-start items-center">
      {!client && (
        <div className="flex flex-col items-center m-4">
          <h1 className="text-3xl text-center">Loading...</h1>
          <div
            className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full mt-4"
            role="status"
          ></div>
        </div>
      )}
      <div className="w-[20%] h-[20%] bg-green m-8">My Tree</div>
      <div className="w-[20%] h-[20%] bg-green m-8">Impact NFT</div>

      {details?.lockDetails ? (
        <>
          {" "}
          <Panel className="flex flex-row mx-auto mb-9 p-3 sm:p-4 rounded-lg">
            <Button variant="primary" className="mr-4" disabled={!needsUpdate}>
              Update
            </Button>
            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={() => {
                setIsBusy(true);
                unlock().finally(() => {
                  setIsBusy(false);
                });
              }}
            >
              {isBusy ? (
                <Spinner className="sm:ml-0 sm:mr-5 px-2 rounded" />
              ) : (
                "Unlock"
              )}
            </Button>
          </Panel>
          <div className="font-bold">
            Locked -{" "}
            {toFixedWithPrecision(toSol(details.lockDetails?.amountLocked))}{" "}
            gSol
          </div>
        </>
      ) : (
        <LockForm lock={lock} />
      )}
      <div className="mt-24">Lock your gSOL for **** to reach level 1</div>
    </div>
  );
};

export { LockingApp };
