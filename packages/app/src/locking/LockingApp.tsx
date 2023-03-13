import clx from "classnames";
import { useWallet } from "@solana/wallet-adapter-react";
import { toSol, type Details } from "@sunrisestake/client";
import React, {
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  Button,
  LockForm,
  Panel,
  Spinner,
  TooltipPopover,
} from "../common/components";
import {
  NotificationType,
  notifyTransaction,
} from "../common/components/notifications";
import { useZenMode } from "../common/context/ZenModeContext";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { type SunriseClientWrapper } from "../common/sunriseClientWrapper";
import {
  solToCarbon,
  solToLamports,
  toFixedWithPrecision,
  ZERO,
} from "../common/utils";
import { ImpactNFT } from "./ImpactNFT";
import { IoChevronUpOutline } from "react-icons/io5";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useForest } from "../common/context/forestContext";
import { tooltips } from "../common/content/tooltips";

const canBeUpdated = (details: Details | undefined): boolean => {
  if (!details?.lockDetails) return false;
  return (
    details.lockDetails.updatedToEpoch.toNumber() < details.currentEpoch.epoch
  );
};

// one full epoch has passed since the lock was created
const canBeUnlocked = (details: Details | undefined): boolean => {
  if (!details?.lockDetails) return false;
  return (
    details.lockDetails.startEpoch.toNumber() < details.currentEpoch.epoch - 1
  );
};

const LockDetailTag: FC<PropsWithChildren> = ({ children }) => (
  <span className="inline-flex gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
    {children}
  </span>
);

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
      showBGImage: false,
      showHelpButton: true,
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
  const needsUpdate = useMemo(() => canBeUpdated(details), [details]);
  const unlockAllowed = useMemo(() => canBeUnlocked(details), [details]);

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
        txes.forEach((tx: string, index) => {
          notifyTransaction({
            type: NotificationType.success,
            message: `Locking successful (tx: ${index} of ${txes.length})`,
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
        txes.forEach((tx: string, index) => {
          notifyTransaction({
            type: NotificationType.success,
            message: `Unlocking successful (tx: ${index} of ${txes.length})`,
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
        txes.forEach((tx: string, index) => {
          notifyTransaction({
            type: NotificationType.success,
            message: `Unlocking successful (tx: ${index} of ${txes.length})`,
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
      {myTree && details?.lockDetails === undefined && (
        <DynamicTree details={myTree} variant="sm" />
      )}
      {details?.impactNFTDetails === undefined && (
        <div className="mb-3">
          <h1 className="font-bold text-green-light text-3xl">
            Lock gSOL to receive an Impact NFT
          </h1>
        </div>
      )}
      {details?.impactNFTDetails && (
        <div className="max-w-sm rounded shadow-lg">
          <ImpactNFT details={details.impactNFTDetails} />
          <div className="px-6 py-4">
            <div className="font-bold text-xl mb-2">Your Impact NFT</div>
            <p className="text-gray-700 text-base">
              Your Impact NFT is proof of your stake. It grows as your stake
              matures. Return regularly to upgrade your NFT to the next level.
            </p>
          </div>
          <div className="px-6 pt-4 pb-2">
            <LockDetailTag>
              Locked -{" "}
              {toFixedWithPrecision(
                toSol(details.lockDetails?.amountLocked ?? ZERO)
              )}{" "}
              gSOL <TooltipPopover>{tooltips.lockCarbon}</TooltipPopover>
            </LockDetailTag>
            <LockDetailTag>
              Yield accrued -{" "}
              {toFixedWithPrecision(
                toSol(details.lockDetails?.yield ?? ZERO),
                3
              )}{" "}
              gSOL
              <TooltipPopover>{tooltips.lockYield}</TooltipPopover>
            </LockDetailTag>
            <LockDetailTag>
              Equivalent carbon price -{" "}
              {toFixedWithPrecision(
                solToCarbon(toSol(details.lockDetails?.yield ?? ZERO)),
                3
              )}{" "}
              tCO₂E
              <TooltipPopover>{tooltips.lockCarbon}</TooltipPopover>
            </LockDetailTag>
            {/* <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"> */}
            {/*  Next level at -{" "} */}
            {/*  TODO */}
            {/*  gSol */}
            {/* </span> */}
          </div>
        </div>
      )}

      {details?.lockDetails ? (
        <>
          <Panel className="flex flex-row mb-9 p-3 sm:p-4 rounded-lg">
            <Button
              color="primary"
              className="mr-4"
              disabled={!needsUpdate}
              title="Upgrade your NFT to the next level after it has accrued enough yield"
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
                "Upgrade"
              )}
            </Button>
            <Button
              color="secondary"
              disabled={isBusyUnlock || !unlockAllowed}
              title="Unlocking is allowed after one full epoch"
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
        </>
      ) : (
        <>
          <LockForm lock={lock} />
        </>
      )}
    </div>
  );
};

const LockingApp = forwardRef(_LockingApp);

export { LockingApp };
