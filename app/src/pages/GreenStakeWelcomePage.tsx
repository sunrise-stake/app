import { FC, FormEvent, useCallback, useEffect, useState } from "react";
import { useGreenStake, useReadOnlyGreenStake } from "../hooks/useGreenStake";
import BN from "bn.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toSol } from "../lib/util";
import { LAMPORTS_PER_SOL, TokenAmount } from "@solana/web3.js";
import { BalanceInfo } from "../lib/greenStake";
import Spinner from "../components/Spinner";
import CarbonRecovered from "../components/CarbonRecovered";

// TODO remove duplication with greenStake

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
      {!client && <Spinner />}
      {treasuryBalanceLamports && (
        <CarbonRecovered treasuryBalanceLamports={treasuryBalanceLamports} />
      )}
    </div>
  );
};
