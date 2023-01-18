import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";
import clx from "classnames";
import { FC, useCallback, useEffect, useState } from "react";
import { FaLeaf } from "react-icons/fa";
import { TbLeafOff } from "react-icons/tb";

import { useSunriseStake } from "../hooks/useSunriseStake";
import { BalanceInfo } from "../lib/stakeAccount";
import StakeForm from "../components/StakeForm";
import BalanceInfoTable, { solToCarbon } from "../components/BalanceInfoTable";
import { toBN, toFixedWithPrecision, toSol } from "../lib/util";
import { TicketAccount } from "../lib/client/types/TicketAccount";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import UnstakeForm from "../components/UnstakeForm";
import { InfoBox } from "../components/InfoBox";
import WithdrawTicket from "../components/WithdrawTickets";

export const StakeDashboard: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const client = useSunriseStake();
  const [txSig, setTxSig] = useState<string>();
  const [error, setError] = useState<Error>();
  const [solBalance, setSolBalance] = useState<BN>();
  const [stakeBalance, setStakeBalance] = useState<BalanceInfo>();
  const [treasuryBalanceLamports, setTreasuryBalanceLamports] = useState<BN>();
  const [delayedWithdraw, setDelayedWithdraw] = useState(false);
  const [delayedUnstakeTickets, setDelayedUnstakeTickets] = useState<
    TicketAccount[]
  >([]);
  const [isStakeSelected, setIsStakeSelected] = useState(true);

  const updateBalances = useCallback(async () => {
    if (!wallet.publicKey || !client) return;
    setSolBalance(await connection.getBalance(wallet.publicKey).then(toBN));
    setStakeBalance(await client.getBalance());
    setTreasuryBalanceLamports(await client.treasuryBalance());
    setDelayedUnstakeTickets(await client.getDelayedUnstakeTickets());
  }, [wallet.publicKey, client, connection]);

  const handleError = useCallback((error: Error) => {
    setError(error);
    console.error(error);
  }, []);

  useEffect(() => {
    if (!wallet.connected) return;
    updateBalances().catch(console.error);
  }, [wallet, connection, setSolBalance, client, updateBalances]);

  const deposit = useCallback(
    (amount: string) => {
      if (!client) return;

      client
        .deposit(new BN(Number(amount) * LAMPORTS_PER_SOL))
        .then(setTxSig)
        .then(updateBalances)
        .catch(handleError);
    },
    [client, updateBalances]
  );

  const withdraw = useCallback(
    (amount: string) => {
      if (!client) return;

      const withdraw = delayedWithdraw
        ? client.orderWithdrawal.bind(client)
        : client.withdraw.bind(client);

      withdraw(new BN(Number(amount) * LAMPORTS_PER_SOL))
        .then(setTxSig)
        .then(updateBalances)
        .catch(handleError);
    },
    [client, updateBalances, delayedWithdraw]
  );

  const redeem = useCallback(
    (ticket: TicketAccount) => {
      if (!client) return;

      client
        .claimUnstakeTicket(ticket)
        .then(setTxSig)
        .then(updateBalances)
        .catch(handleError);
    },
    [client, updateBalances]
  );

  return (
    <div style={{ maxWidth: "864px" }} className="mx-auto">
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
        <Panel className="inline-block mx-auto mb-9 p-4 rounded-lg">
          <Button
            variant={isStakeSelected ? "primary" : "secondary"}
            className="mr-5"
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
            gSolBalance={
              stakeBalance && new BN(stakeBalance.gsolBalance.amount)
            }
            withdraw={withdraw}
            setDelayedWithdraw={setDelayedWithdraw}
            delayedWithdraw={delayedWithdraw}
          />
        )}
        <div
          style={{ display: "none" }}
          className="bg-neutral-800 rounded-lg m-4"
        >
          <BalanceInfoTable
            solBalance={solBalance}
            stakeBalance={stakeBalance}
            treasuryBalanceLamports={treasuryBalanceLamports}
            delayedUnstakeTickets={delayedUnstakeTickets}
            redeem={redeem}
          />
        </div>
        {txSig !== undefined && <div>Done {txSig}</div>}
        {error != null && <div>Error: {error.message}</div>}
      </Panel>
      <div className="grid gap-8 grid-cols-3 grid-rows-1 my-10 text-base">
        <InfoBox className="p-2 rounded text-center">
          <span className="font-bold text-xl">
            {stakeBalance &&
              toFixedWithPrecision(toSol(stakeBalance.extractableYield))}
          </span>
          <br />
          gSOL
        </InfoBox>
        <InfoBox className="p-2 rounded text-center">
          <span className="font-bold text-xl">
            {stakeBalance &&
              toFixedWithPrecision(
                solToCarbon(toSol(stakeBalance.extractableYield))
              )}
          </span>
          <br />
          tCO₂E
        </InfoBox>
        <InfoBox className="p-2 rounded text-center">
          <span className="font-bold text-xl">
            {treasuryBalanceLamports &&
              stakeBalance &&
              toFixedWithPrecision(
                solToCarbon(
                  toSol(
                    treasuryBalanceLamports.add(stakeBalance.extractableYield)
                  )
                )
              )}
          </span>
          <br />
          Total tCO₂E
        </InfoBox>
      </div>

      <div className="flex flex-col items-center">
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
