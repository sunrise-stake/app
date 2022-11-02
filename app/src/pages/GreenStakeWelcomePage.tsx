import { FC, FormEvent, useCallback, useEffect, useState } from "react";
import { useGreenStake, useReadOnlyGreenStake } from "../hooks/useGreenStake";
import BN from "bn.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toSol } from "../lib/util";
import { LAMPORTS_PER_SOL, TokenAmount } from "@solana/web3.js";
import { BalanceInfo } from "../lib/greenStake";

// TODO remove duplication with greenStake

// TODO TEMP lookup
const SOL_PRICE_USD_CENTS = 3300;
const CARBON_PRICE_USD_CENTS_PER_TONNE = 8021;

const solToCarbon = (sol: number) =>
  (sol * SOL_PRICE_USD_CENTS) / CARBON_PRICE_USD_CENTS_PER_TONNE;

export const GreenStakeWelcomePage: FC = () => {
  const { connection } = useConnection();
  const client = useReadOnlyGreenStake();
  const [treasuryBalanceLamports, setTreasuryBalanceLamports] =
    useState<number>();

  const updateBalances = useCallback(async () => {
    if (!client) return;
    setTreasuryBalanceLamports(await client.treasuryBalance());
  }, [client, connection]);

  useEffect(() => {
    if (!client) return;
    updateBalances();
  }, [connection, client]);

  return (
    <div className="w-full">
      {!client && (
        <div className="flex justify-center items-center my-1">
          <div
            className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full"
            role="status"
          ></div>
        </div>
      )}
      {treasuryBalanceLamports && (
        <div className="grid grid-rows-3 items-center justify-center grid-flow-col">
          <div className="flex flex-col justify-center items-center">
            <h4 className="flex-auto font-medium center leading-tight text-1xl grid-row">
              so far
            </h4>
            <h1 className="font-medium leading-tight text-4xl ">
              {solToCarbon(toSol(treasuryBalanceLamports)).toFixed(2)} tCO₂E
            </h1>
            <h4 className="flex-auto font-medium leading-tight text-xl">
              carbon recovered
            </h4>
          </div>
        </div>
      )}
    </div>
  );
};
