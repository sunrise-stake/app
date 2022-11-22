import { FC, useCallback, useEffect, useState } from "react";
import { useSunriseStake } from "../hooks/useSunriseStake";
import BN from "bn.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BalanceInfo } from "../lib/stakeAccount";
import StakeForm from "../components/stakeForm";
import BalanceInfoTable from "../components/BalanceInfoTable";
import { toBN } from "../lib/util";

export const StakeDashboard: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const client = useSunriseStake();
  const [txSig, setTxSig] = useState<string>();
  const [error, setError] = useState<Error>();
  const [solBalance, setSolBalance] = useState<BN>();
  const [stakeBalance, setStakeBalance] = useState<BalanceInfo>();
  const [treasuryBalanceLamports, setTreasuryBalanceLamports] = useState<BN>();

  const updateBalances = useCallback(async () => {
    if (!wallet.publicKey || !client) return;
    setSolBalance(await connection.getBalance(wallet.publicKey).then(toBN));
    setStakeBalance(await client.getBalance());
    setTreasuryBalanceLamports(await client.treasuryBalance());
  }, [wallet.publicKey, client, connection]);

  useEffect(() => {
    if (!wallet.connected) return;
    updateBalances().catch(console.error);
  }, [wallet, connection, setSolBalance, client, updateBalances]);

  const deposit = useCallback(
    (amount: string) => {
      if (!client) return;

      client
        .deposit(new BN(amount).mul(new BN(LAMPORTS_PER_SOL)))
        .then(setTxSig)
        .then(updateBalances)
        .catch(setError);
    },
    [client, updateBalances]
  );

  const withdraw = useCallback(
    (amount: string) => {
      if (!client) return;

      client
        .withdraw(new BN(amount).mul(new BN(LAMPORTS_PER_SOL)))
        .then(setTxSig)
        .then(updateBalances)
        .catch(setError);
    },
    [client, updateBalances]
  );

  return (
    <div>
      <div className="bg-neutral-800 flex flex-col items-center mt-5 rounded-lg">
        {!client && (
          <div className="flex flex-col items-center m-4">
            <h1 className="text-3xl text-center">Loading...</h1>
            <div
              className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full mt-4"
              role="status"
            ></div>
          </div>
        )}
        <div className="mt-2">
          <StakeForm withdraw={withdraw} deposit={deposit} />
        </div>
        <div className="bg-neutral-800 rounded-lg m-4">
          <BalanceInfoTable
            solBalance={solBalance}
            stakeBalance={stakeBalance}
            treasuryBalanceLamports={treasuryBalanceLamports}
          />
        </div>
        {txSig !== undefined && <div>Done {txSig}</div>}
        {error != null && <div>Error {error.message}</div>}
      </div>
    </div>
  );
};
