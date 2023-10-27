import { useWallet } from "@solana/wallet-adapter-react";
import { type Details } from "@sunrisestake/client";
import clx from "classnames";
import React, {
  forwardRef,
  type ForwardRefRenderFunction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { Button, Panel, Spinner } from "../common/components";
import {
  NotificationType,
  notifyTransaction,
} from "../common/components/notifications";
import { useZenMode } from "../common/context/ZenModeContext";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { solToLamports } from "../common/utils";
import { ImpactNFT } from "./ImpactNFT";
import { IoChevronUpOutline } from "react-icons/io5";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useForest } from "../common/context/forestContext";
import { AppRoute } from "../Routes";
import { useHelp } from "../common/context/HelpContext";
import { useNFTs } from "../common/context/NFTsContext";
import { LockDetailsView } from "./LockDetails";
import { detailsIndicateUpgradePossible } from "./utils";
import { LockForm } from "./LockForm";
import { LockingSuccessModal } from "./LockingSuccessModal";
import { useInfoModal } from "../common/hooks/useInfoModal";
import { LinkWithQuery } from "../common/components/LinkWithQuery";

// one full epoch has passed since the lock was created
const canBeUnlocked = (details: Details | undefined): boolean => {
  if (!details?.lockDetails) return false;
  return (
    details.lockDetails.startEpoch.toNumber() < details.currentEpoch.epoch - 1
  );
};

const upgradeTooltip = (enabled: boolean): string => {
  if (!enabled)
    return "Come back to upgrade your NFT to the next level after it has accrued enough yield";
  return "Upgrade your NFT to the next level";
};

const _LockingApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();
  const { myTree } = useForest();
  const { refresh } = useNFTs();
  const navigate = useNavigate();
  const wallet = useWallet();
  useEffect(() => {
    if (!wallet.connected && active) navigate("/");
  }, [active, wallet.connected]);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Lock) return; // we are not on the lock page, so don't update zen mode
    updateZenMode((prev) => ({
      ...prev,
      showBGImage: false,
      showHelpButton: true,
      showWallet: active,
      showExternalLinks: true,
    }));
  }, [active, currentHelpRoute]);

  const { client, details, loading } = useSunriseStake();

  const [isBusyUnlock, setIsBusyUnlock] = useState(false);
  const [isBusyUpdate, setIsBusyUpdate] = useState(false);
  const needsUpgrade = useMemo(
    () => detailsIndicateUpgradePossible(details),
    [details]
  );
  const unlockAllowed = useMemo(() => canBeUnlocked(details), [details]);
  const [amount, setAmount] = useState("");

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

    setAmount(amount);

    return client
      .lockGSol(solToLamports(amount))
      .then((txes) => {
        lockingSucessModalControl.trigger();
        refresh().catch(console.error); // refresh NFTs so that the impact NFT shows up
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
        refresh().catch(console.error); // refresh NFTs so that the impact NFT shows up
        txes.forEach((tx: string, index) => {
          notifyTransaction({
            type: NotificationType.success,
            message: `Updating successful (tx: ${index} of ${txes.length})`,
            txid: tx,
          });
        });
      })
      .catch(handleError);
  };
  const lockingSucessModalControl = useInfoModal();

  return (
    <div
      className={clx(
        "container mx-auto flex flex-col justify-start items-center pb-12",
        className
      )}
      ref={ref}
      {...rest}
    >
      <LockingSuccessModal
        control={lockingSucessModalControl}
        amount={amount}
      />
      {(!client || loading) && (
        <div className="flex flex-col items-center m-4">
          <h1 className="text-3xl text-center">Loading...</h1>
          <div
            className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full mt-4"
            role="status"
          ></div>
        </div>
      )}
      <div className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl mt-8">
        <LinkWithQuery
          to="/"
          className="flex items-center text-green justify-center"
        >
          <div className="flex items-center nowrap">
            <IoChevronUpOutline className="inline" size={48} />
          </div>
        </LinkWithQuery>
      </div>
      {myTree && details?.impactNFTDetails === undefined && (
        <DynamicTree className="-mb-11" details={myTree} variant="sm" />
      )}
      {details?.lockDetails === undefined && (
        <div className="mb-3 justify-center content-center items-center">
          <h1 className="font-bold text-green-light text-3xl text-center">
            Lock gSOL to receive an Impact NFT
          </h1>
        </div>
      )}
      {details?.impactNFTDetails && (
        <div className="max-w-sm rounded shadow-lg">
          <ImpactNFT details={details.impactNFTDetails} />
          {details?.lockDetails && (
            <LockDetailsView lockDetails={details.lockDetails} />
          )}
        </div>
      )}

      {details?.lockDetails ? (
        <>
          <Panel className="flex flex-row mb-9 p-3 sm:p-4 rounded-lg">
            <Button
              color="primary"
              className={clx(
                "mr-4",
                needsUpgrade && "animate-pulse",
                !needsUpgrade && "brightness-75"
              )}
              title={upgradeTooltip(needsUpgrade)}
              infoDisabled={!needsUpgrade}
              disabledTitle="Come back later"
              disabledMessage="Your impact NFT is not yet eligible for the next level."
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
              className={clx(!unlockAllowed && "brightness-75")}
              title="Unlocking is allowed after one full epoch"
              infoDisabled={isBusyUnlock || !unlockAllowed}
              disabledTitle="Come back later"
              disabledMessage="Locked gSOL can be unlocked after one full epoch (2-3 days)."
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
