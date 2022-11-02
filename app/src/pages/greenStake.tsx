import { FC, FormEvent, useCallback, useEffect, useState } from "react";
import { useGreenStake } from "../hooks/useGreenStake";
import BN from "bn.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toSol } from "../lib/util";
import { LAMPORTS_PER_SOL, TokenAmount } from "@solana/web3.js";
import { BalanceInfo } from "../lib/greenStake";
import StakeForm from "./StakeForm";

// TODO TEMP lookup
const SOL_PRICE_USD_CENTS = 3300;
const CARBON_PRICE_USD_CENTS_PER_TONNE = 8021;

const solToCarbon = (sol: number) =>
  (sol * SOL_PRICE_USD_CENTS) / CARBON_PRICE_USD_CENTS_PER_TONNE;

export const GreenStake: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const client = useGreenStake();
  const [txSig, setTxSig] = useState<string>();
  const [error, setError] = useState<Error>();
  const [solBalance, setSolBalance] = useState<number>();
  const [stakeBalance, setStakeBalance] = useState<BalanceInfo>();
  const [treasuryBalanceLamports, setTreasuryBalanceLamports] =
    useState<number>();

  const updateBalances = useCallback(async () => {
    if (!wallet.publicKey || !client) return;
    setSolBalance(await connection.getBalance(wallet.publicKey));
    setStakeBalance(await client.getBalance());
    setTreasuryBalanceLamports(await client.treasuryBalance());
  }, [wallet.publicKey, client, connection]);

  useEffect(() => {
    if (!wallet || !wallet.connected || !wallet.publicKey) return;
    updateBalances();
  }, [wallet, connection, setSolBalance, client]);

  const deposit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!client) return;
      const target = e.target as typeof e.target & {
        amount: { value: number };
      };

      client
        .deposit(new BN(target.amount.value).mul(new BN(LAMPORTS_PER_SOL)))
        .then(setTxSig)
        .then(updateBalances)
        .catch(setError);
    },
    [client]
  );

  const withdraw = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!client) return;
      client.withdraw().then(setTxSig).then(updateBalances).catch(setError);
    },
    [client]
  );

  return (
    <div>
      <div className="rounded-xl px-7 py-8 mb-3 bg-neutral-100">
        {!client && <div>Loading...</div>}
        {solBalance && (
          <div className="grid grid-rows-2">
            <h2 className="text-3xl">{toSol(solBalance)} ◎</h2>
            <h2>Available balance to deposit</h2>
          </div>
        )}
        {stakeBalance && (
          <div className="grid grid-rows-5 gap-2">
            <div>
              <h4 className="text-3xl">
                {stakeBalance.depositedSol.uiAmountString} ◎
              </h4>
              <h4 className="text-md">Deposited SOL</h4>
            </div>
            <div>
              <h4 className="text-3xl">
                {stakeBalance.msolBalance.uiAmountString}
              </h4>
              <h4 className="text-md">mSOL</h4>
            </div>
            <div>
              <h4 className="text-3xl">{toSol(stakeBalance.earnedLamports)}</h4>
              <h4>Earned</h4>
            </div>
            <div>
              <h4 className="text-3xl">{toSol(stakeBalance.earnedLamports)}</h4>
              <h4>Your tCO₂E </h4>
            </div>
            {treasuryBalanceLamports && (
              <div>
                <h4 className="text-3xl bold">
                  {solToCarbon(toSol(treasuryBalanceLamports))}
                </h4>
                <h4>Your Total tCO₂E </h4>
              </div>
            )}
          </div>
        )}
        {txSig && <div>Done! {txSig}</div>}
        {error && <div>Error! {error.message}</div>}
      </div>
      <div className="rounded-xl px-7 py-">
        <StakeForm withdraw={withdraw} deposit={deposit} />
      </div>
    </div>
  );
};
