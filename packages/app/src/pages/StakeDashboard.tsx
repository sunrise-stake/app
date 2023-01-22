import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import clx from "classnames";
import { FC, useCallback, useEffect, useState } from "react";
import { FaLeaf } from "react-icons/fa";
import { TbLeafOff } from "react-icons/tb";
import { GiCircleForest } from "react-icons/gi";

import StakeForm from "../components/StakeForm";
import { solToLamports, toBN, toFixedWithPrecision, toSol } from "../lib/util";
import { TicketAccount } from "../lib/client/types/TicketAccount";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import UnstakeForm from "../components/UnstakeForm";
import { InfoBox } from "../components/InfoBox";
import WithdrawTicket from "../components/WithdrawTickets";
import { useSunriseStake } from "../context/sunriseStakeContext";
import {
  NotificationType,
  notifyTransaction,
  notifyTweet,
} from "../utils/notifications";
import { useCarbon } from "../hooks/useCarbon";
import { DetailsBox } from "../components/DetailsBox";

export const StakeDashboard: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { client, details } = useSunriseStake();
  const [solBalance, setSolBalance] = useState<BN>();
  const [delayedWithdraw, setDelayedWithdraw] = useState(false);
  const [delayedUnstakeTickets, setDelayedUnstakeTickets] = useState<
    TicketAccount[]
  >([]);
  const [isStakeSelected, setIsStakeSelected] = useState(true);
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
    (amount: string) => {
      if (!client) return;

      client
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
    (amount: string) => {
      if (!client) return;

      const withdraw = delayedWithdraw
        ? client.orderWithdrawal.bind(client)
        : client.withdraw.bind(client);

      withdraw(solToLamports(amount))
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
    (ticket: TicketAccount) => {
      if (!client) return;

      client
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

  return (
    <div style={{ maxWidth: "620px" }} className="mx-auto">
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
            variant={isStakeSelected ? "primary" : "secondary"}
            size={"sm"}
            className="mr-3 sm:mr-5"
            onClick={() => setIsStakeSelected(true)}
          >
            Stake
            <FaLeaf
              className={clx(
                "animate-fade-in inline ml-2 transition-opacity duration-500",
                { hidden: !isStakeSelected }
              )}
              size={24}
            />
          </Button>
          <Button
            variant={isStakeSelected ? "secondary" : "danger"}
            size={"sm"}
            onClick={() => setIsStakeSelected(false)}
          >
            Unstake
            <TbLeafOff
              className={clx(
                "animate-fade-in inline ml-2 transition-opacity duration-500",
                { hidden: isStakeSelected }
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
        {isStakeSelected ? (
          <StakeForm solBalance={solBalance} deposit={deposit} />
        ) : (
          <UnstakeForm
            withdraw={withdraw}
            setDelayedWithdraw={setDelayedWithdraw}
            delayedWithdraw={delayedWithdraw}
          />
        )}
      </Panel>
      <div className="grid gap-8 grid-cols-3 grid-rows-1 my-10 text-base">
        <InfoBox className="py-2 px-4 rounded text-center">
          <div className="flex flex-row justify-between items-center">
            <img
              src={`gSOL.png`}
              className="h-8 my-auto pr-2 hidden sm:block"
            />

            <div className="mx-auto sm:mx-0 items-center">
              <span className="font-bold text-sm sm:text-lg">
                {details !== undefined &&
                  toFixedWithPrecision(
                    toSol(new BN(details.balances.gsolBalance.amount)),
                    2
                  )}{" "}
              </span>
              <span className="text-xs font-bold">gSOL</span>
              <br />
              <div className="mt-1 text-xs sm:text-sm">Your Stake</div>
            </div>
          </div>
        </InfoBox>
        <InfoBox className="py-2 px-4 rounded text-center">
          <div className="flex flex-row justify-between items-center">
            <img src={`SOL.png`} className="h-8 my-auto pr-2 hidden sm:block" />
            <div className="mx-auto sm:mx-0 items-center">
              <span className="font-bold text-sm sm:text-lg">
                {details &&
                  toFixedWithPrecision(
                    toSol(new BN(details.balances.gsolSupply.amount)),
                    2
                  )}{" "}
              </span>
              <span className="text-xs font-bold">SOL</span>

              <br />
              <div className="mt-1 text-xs sm:text-sm">Total Stake</div>
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
              <span className="font-bold text-sm sm:text-lg">
                {totalCarbon !== undefined &&
                  toFixedWithPrecision(totalCarbon, 2)}{" "}
              </span>
              <span className="text-xs font-bold">tCO₂E</span>
              <div className="mt-1 text-xs sm:text-sm">Offset CO₂</div>
            </div>
          </div>
        </InfoBox>
      </div>
      <div className="flex flex-col gap-8 mb-8 -mt-4 justify-center">
        <DetailsBox />
      </div>
      <div className="flex flex-col gap-8 mb-8 justify-center">
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
    </div>
  );
};
