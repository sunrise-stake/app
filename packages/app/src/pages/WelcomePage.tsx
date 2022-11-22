import { FC, useCallback, useEffect, useState } from "react";
import { useReadOnlySunriseStake } from "../hooks/useSunriseStake";
import Spinner from "../components/Spinner";
import CarbonRecovered from "../components/CarbonRecovered";
import BN from "bn.js";
import { ZERO } from "../lib/util";

// TODO remove duplication with StakeDashboard

export const WelcomePage: FC = () => {
  const client = useReadOnlySunriseStake();
  const [treasuryBalanceLamports, setTreasuryBalanceLamports] = useState<BN>();

  const updateBalances = useCallback(async () => {
    if (!client) return;
    setTreasuryBalanceLamports(await client.treasuryBalance());
  }, [client]);

  useEffect((): void => {
    if (!client) return;
    updateBalances().catch(console.error);
  }, [updateBalances, client]);

  return (
    <div className="w-full">
      {!client && <Spinner />}
      <CarbonRecovered
        treasuryBalanceLamports={treasuryBalanceLamports ?? ZERO}
      />
    </div>
  );
};
