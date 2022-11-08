import { FC, useCallback, useEffect, useState } from "react";
import { useReadOnlySunriseStake } from "../hooks/useSunriseStake";
import { useConnection } from "@solana/wallet-adapter-react";
import Spinner from "../components/Spinner";
import CarbonRecovered from "../components/CarbonRecovered";

// TODO remove duplication with StakeDashboard

export const WelcomePage: FC = () => {
  const { connection } = useConnection();
  const client = useReadOnlySunriseStake();
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
