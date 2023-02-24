import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { type TicketAccount, type Details, toSol } from "@sunrisestake/client";
import BN from "bn.js";
import clx from "classnames";
import { type FC, useCallback, useEffect, useState } from "react";
import { FaLeaf, FaLock } from "react-icons/fa";
import { TbLeafOff } from "react-icons/tb";
import { GiCircleForest } from "react-icons/gi";

import {
  solToLamports,
  toBN,
  toFixedWithPrecision,
  type UIMode,
} from "../../common/utils";
import {
  DetailsBox,
  Panel,
  Button,
  InfoBox,
  TooltipPopover,
  LockForm,
  LockedGSol,
} from "../../common/components";
import { useSunriseStake } from "../../common/context/sunriseStakeContext";
import {
  NotificationType,
  notifyTransaction,
  notifyTweet,
} from "../../common/components/notifications";
import { useCarbon } from "../../common/hooks/useCarbon";
import { tooltips } from "../../common/content/tooltips";
import { type SunriseClientWrapper } from "../../common/sunriseClientWrapper";
import { StakeForm, UnstakeForm, WithdrawTicket } from "../components";

const StakeDashboard: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const {
    client,
    details,
  }: {
    client: SunriseClientWrapper | undefined;
    details: Details | undefined;
  } = useSunriseStake();
  const [solBalance, setSolBalance] = useState<BN>();
  const [delayedWithdraw, setDelayedWithdraw] = useState(false);
  const [delayedUnstakeTickets, setDelayedUnstakeTickets] = useState<
    TicketAccount[]
  >([]);
  const [mode, setMode] = useState<UIMode>("STAKE");
  const { totalCarbon } = useCarbon();

  // TODO move to details?
  const setBalances = useCallback(async () => {
    if (!wallet.publicKey || !client) return;
    setSolBalance(await connection.getBalance(wallet.publicKey).then(toBN));
    setDelayedUnstakeTickets(await client.getDelayedUnstakeTickets());
  }, [wallet.publicKey?.toBase58(), client, connection]);

  const handleError = useCallback((error: Error) => {
    notifyTransaction({
      type: NotificationType.error,
      message: "Transaction failed",
      description: error.message,
    });
    console.error(error);
  }, []);

  useEffect(() => {
    if (!wallet.publicKey) return;
    setBalances().catch(console.error);
  }, [
    wallet.publicKey?.toBase58(),
    connection,
    setSolBalance,
    client,
    setBalances,
  ]);

  const deposit = useCallback(
    async (amount: string) => {
      if (!client) return Promise.reject(new Error("Client not initialized"));

      return client
        .deposit(solToLamports(amount))
        .then((tx) => {
          notifyTweet(amount);
          notifyTransaction({
            type: NotificationType.success,
            message: "Deposit successful",
            txid: tx,
          });
        })
        .then(setBalances)
        .catch(handleError);
    },
    [client, setBalances]
  );

  const withdraw = useCallback(
    async (amount: string) => {
      if (!client) return Promise.reject(new Error("Client not initialized"));

      const withdraw = delayedWithdraw
        ? client.orderWithdrawal.bind(client)
        : client.withdraw.bind(client);

      return withdraw(solToLamports(amount))
        .then((tx) => {
          notifyTransaction({
            type: NotificationType.success,
            message: "Withdrawal successful",
            txid: tx,
          });
        })
        .then(setBalances)
        .catch(handleError);
    },
    [client, setBalances, delayedWithdraw]
  );

  const redeem = useCallback(
    async (ticket: TicketAccount) => {
      if (!client) return Promise.reject(new Error("Client not initialized"));

      return client
        .claimUnstakeTicket(ticket)
        .then((tx) => {
          notifyTransaction({
            type: NotificationType.success,
            message: "Redeeming successful",
            txid: tx,
          });
        })
        .then(setBalances)
        .catch(handleError);
    },
    [client, setBalances]
  );

  const lock = useCallback(
    async (amount: string) => {
      if (!client) return Promise.reject(new Error("Client not initialized"));
      await client.lockGSol(solToLamports(amount));
    },
    [client]
  );

  const unlock = useCallback(async () => {
    if (!client) return Promise.reject(new Error("Client not initialized"));
    await client.unlockGSol();
  }, [client]);

  const updateLockAccount = useCallback(async () => {
    if (!client) return Promise.reject(new Error("Client not initialized"));
    await client.updateLockAccount();
  }, [client]);

  return (
    <div style={{ maxWidth: "620px" }} className="mx-auto relative">
      <div className="text-center">
        <img
          className="block sm:hidden w-auto h-16 mx-auto mb-3"
          src={"./logo.png"}
          alt="Sunrise"
        />
        <h2 className="text-green-bright font-bold text-6xl">Sunrise Stake</h2>
        <h3 className="mb-16 text-white font-normal text-3xl">
          Offset emissions while you sleep.
        </h3>
      </div>
      <div className="flex">
        <Panel className="flex flex-row mx-auto mb-9 p-3 sm:p-4 rounded-lg">
          <Button
            variant={mode === "STAKE" ? "primary" : "secondary"}
            size={"sm"}
            className="mr-3 sm:mr-5"
            onClick={() => {
              setMode("STAKE");
            }}
          >
            Stake
            <FaLeaf
              className={clx(
                "animate-fade-in inline ml-2 transition-opacity duration-500",
                { hidden: mode !== "STAKE" }
              )}
              size={24}
            />
          </Button>
          <Button
            variant={mode === "UNSTAKE" ? "secondary" : "danger"}
            size={"sm"}
            onClick={() => {
              setMode("UNSTAKE");
            }}
          >
            Unstake
            <TbLeafOff
              className={clx(
                "animate-fade-in inline ml-2 transition-opacity duration-500",
                { hidden: mode !== "UNSTAKE" }
              )}
              size={24}
            />
          </Button>
          <Button
            variant={mode === "LOCK" ? "primary" : "secondary"}
            size={"sm"}
            className="ml-3 sm:ml-5"
            onClick={() => {
              setMode("LOCK");
            }}
          >
            Lock
            <FaLock
              className={clx(
                "animate-fade-in inline ml-2 transition-opacity duration-500",
                { hidden: mode !== "LOCK" }
              )}
              size={24}
            />
          </Button>
        </Panel>
      </div>
      <Panel className="p-10 rounded-lg">
        {!client && (
          <div className="flex flex-col items-center m-4">
            <h1 className="text-3xl text-center">Loading...</h1>
            <div
              className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full mt-4"
              role="status"
            ></div>
          </div>
        )}
        {mode === "STAKE" && (
          <StakeForm solBalance={solBalance} deposit={deposit} />
        )}
        {mode === "UNSTAKE" && (
          <UnstakeForm
            withdraw={withdraw}
            setDelayedWithdraw={setDelayedWithdraw}
            delayedWithdraw={delayedWithdraw}
          />
        )}
        {mode === "LOCK" && <LockForm lock={lock} />}
      </Panel>

      <div className="relative z-30 grid gap-8 grid-cols-3 grid-rows-1 my-10 text-base">
        <InfoBox className="py-2 px-4 rounded text-center">
          <div className="flex flex-row justify-between items-center">
            <img
              src={`gSOL.png`}
              alt="gSOL"
              className="h-8 my-auto pr-2 hidden sm:block"
            />
            <div className="mx-auto sm:mx-0 items-center">
              <div className="flex flex-col gap-0 sm:gap-2 items-center justify-end sm:flex-row mb-2 sm:mb-0">
                <span className="font-bold text-sm sm:text-lg">
                  {details !== undefined &&
                    toFixedWithPrecision(
                      toSol(new BN(details.balances.gsolBalance.amount)),
                      2
                    )}{" "}
                </span>
                <span className="text-xs font-bold">gSOL</span>
              </div>

              {/* <br /> */}
              <div className="flex flex-col-reverse gap-2 items-center sm:flex-row">
                <div className="text-xs sm:text-sm">Your Stake</div>
                <TooltipPopover>{tooltips.yourStake}</TooltipPopover>
              </div>
            </div>
          </div>
        </InfoBox>
        <InfoBox className="py-2 px-4 rounded text-center">
          <div className="flex flex-row justify-between items-center">
            <img
              src={`SOL.png`}
              className="h-8 my-auto pr-2 hidden sm:block"
              alt="sol"
            />
            <div className="mx-auto sm:mx-0 items-center">
              <div className="flex flex-col gap-0 sm:gap-2 items-center justify-end sm:flex-row mb-2 sm:mb-0">
                <span className="font-bold text-sm sm:text-lg">
                  {details != null &&
                    toFixedWithPrecision(
                      toSol(new BN(details.balances.gsolSupply.amount)),
                      2
                    )}{" "}
                </span>
                <span className="text-xs font-bold">SOL</span>
              </div>

              <div className="flex flex-col-reverse gap-2 items-center sm:flex-row">
                <div className="text-xs sm:text-sm">Total Stake</div>
                <TooltipPopover>{tooltips.totalStake}</TooltipPopover>
              </div>
            </div>
          </div>
        </InfoBox>
        <InfoBox className="py-2 px-4 rounded text-center">
          <div className="flex flex-row justify-between items-center">
            <GiCircleForest
              className="hidden sm:block"
              color="#52dc90"
              size={32}
            />

            <div className="mx-auto sm:mx-0 items-center">
              <div className="flex flex-col gap-0 sm:gap-2 items-center justify-end sm:flex-row mb-2 sm:mb-0">
                <span className="font-bold text-sm sm:text-lg">
                  {totalCarbon !== undefined &&
                    toFixedWithPrecision(totalCarbon, 2)}{" "}
                </span>
                <span className="text-xs font-bold">tCO₂E</span>
              </div>
              <div className="flex flex-col-reverse gap-2 items-center sm:flex-row">
                <div className="text-xs sm:text-sm">Offset CO₂</div>
                <TooltipPopover>{tooltips.offsetCO2}</TooltipPopover>
              </div>
            </div>
          </div>
        </InfoBox>
      </div>
      <div className="relative z-20 mb-8 mt-2">
        <DetailsBox />
      </div>

      <div className="relative z-10 flex flex-col gap-8 mb-8 justify-center">
        {delayedUnstakeTickets.map((ticket) => {
          return (
            <WithdrawTicket
              key={ticket.address.toBase58()}
              ticket={ticket}
              redeem={redeem}
            />
          );
        })}
      </div>
      <div className="relative z-10 flex flex-col gap-8 mb-8 justify-center">
        {details?.lockDetails && (
          <LockedGSol
            lockDetails={details.lockDetails}
            epochReport={details.epochReport}
            currentEpoch={details.currentEpoch}
            update={updateLockAccount}
            unlock={unlock}
          />
        )}
      </div>
    </div>
  );
};

export { StakeDashboard };
