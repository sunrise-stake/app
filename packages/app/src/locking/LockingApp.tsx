import clx from "classnames";
import { useWallet } from "@solana/wallet-adapter-react";
import { toSol, type Details } from "@sunrisestake/client";
import {
  forwardRef,
  type ForwardRefRenderFunction,
  useEffect,
  useState,
} from "react";
import { useNavigate, Link } from "react-router-dom";

import { Button, LockForm, Panel, Spinner } from "../common/components";
import {
  NotificationType,
  notifyTransaction,
} from "../common/components/notifications";
import { useZenMode } from "../common/context/ZenModeContext";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { type SunriseClientWrapper } from "../common/sunriseClientWrapper";
import { solToLamports, toFixedWithPrecision } from "../common/utils";
import { ImpactNFT } from "./ImpactNFT";
import { IoChevronUpOutline } from "react-icons/io5";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useForest } from "../common/context/forestContext";

const _LockingApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [, updateZenMode] = useZenMode();
  const { myTree } = useForest();

  useEffect(() => {
    if (!wallet.connected) navigate("/");
  }, [wallet.connected]);

  useEffect(() => {
    updateZenMode({
      showBGImage: active,
      showWallet: active,
    });
  }, [active]);

  const {
    client,
    details,
  }: {
    client: SunriseClientWrapper | undefined;
    details: Details | undefined;
  } = useSunriseStake();

  const [isBusyUnlock, setIsBusyUnlock] = useState(false);
  const [isBusyUpdate, setIsBusyUpdate] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(() => {
    if (!details?.lockDetails) return false;
    return (
      details.lockDetails.updatedToEpoch.toNumber() < details.currentEpoch.epoch
    );
  });

  useEffect(() => {
    if (!details?.lockDetails) {
      setNeedsUpdate(false);
    } else {
      setNeedsUpdate(
        details.lockDetails.updatedToEpoch.toNumber() <
          details.currentEpoch.epoch
      );
    }
  }, [details]);

  const handleError = (error: Error): void => {
    notifyTransaction({
      type: NotificationType.error,
      message: "Transaction failed",
      description: error.message,
    });
    console.error(error);
  };

  const lock = async (amount: string): Promise<void> => {
    if (!client) return Promise.reject(new Error("Client not initialized"));
    return client
      .lockGSol(solToLamports(amount))
      .then((txes) => {
        txes.forEach((tx: string) => {
          notifyTransaction({
            type: NotificationType.success,
            message: `Locking successful (tx: ${tx} of ${txes.length})`,
            txid: tx,
          });
        });
      })
      .catch(handleError);
  };

  const unlock = async (): Promise<void> => {
    if (!client) return Promise.reject(new Error("Client not initialized"));

    return client
      .unlockGSol()
      .then((txes) => {
        txes.forEach((tx: string) => {
          notifyTransaction({
            type: NotificationType.success,
            message: `Unlocking successful (tx: ${tx} of ${txes.length})`,
            txid: tx,
          });
        });
      })
      .catch(handleError);
  };

  const updateLockAccount = async (): Promise<void> => {
    if (!client) return Promise.reject(new Error("Client not initialized"));

    return client
      .updateLockAccount()
      .then((txes) => {
        txes.forEach((tx: string) => {
          notifyTransaction({
            type: NotificationType.success,
            message: `Unlocking successful (tx: ${tx} of ${txes.length})`,
            txid: tx,
          });
        });
      })
      .catch(handleError);
  };

  return (
    <div
      className={clx(
        "container mx-auto flex flex-col justify-start items-center",
        className
      )}
      ref={ref}
      {...rest}
    >
      {!client && (
        <div className="flex flex-col items-center m-4">
          <h1 className="text-3xl text-center">Loading...</h1>
          <div
            className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full mt-4"
            role="status"
          ></div>
        </div>
      )}
      <div className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl mt-8">
        <Link to="/" className="flex items-center text-green justify-center">
          <div className="flex items-center nowrap">
            <IoChevronUpOutline className="inline" size={48} />
          </div>
        </Link>
      </div>
      {myTree && (
        <DynamicTree
          details={myTree}
          variant="sm"
          className={`${
            myTree.metadata.type.translucent ? " saturate-0 opacity-50" : ""
          }`}
        />
      )}

      {details?.impactNFTDetails && (
        <ImpactNFT details={details.impactNFTDetails} />
      )}

      {details?.lockDetails ? (
        <>
          <Panel className="flex flex-row mb-9 p-3 sm:p-4 rounded-lg">
            <Button
              color="primary"
              className="mr-4"
              disabled={!needsUpdate}
              onClick={() => {
                setIsBusyUpdate(true);
                updateLockAccount().finally(() => {
                  setIsBusyUpdate(false);
                });
              }}
            >
              {isBusyUpdate ? (
                <Spinner className="sm:ml-0 sm:mr-5 px-2 rounded" />
              ) : (
                "Update"
              )}
            </Button>
            <Button
              color="secondary"
              disabled={isBusyUnlock}
              onClick={() => {
                setIsBusyUnlock(true);
                unlock().finally(() => {
                  setIsBusyUnlock(false);
                });
              }}
            >
              {isBusyUnlock ? (
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

const LockingApp = forwardRef(_LockingApp);

export { LockingApp };
