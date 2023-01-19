import { FC, useCallback, useEffect, useState } from "react";
import { useSunriseStake } from "../hooks/useSunriseStake";
import Spinner from "../components/Spinner";
import CarbonRecovered from "../components/CarbonRecovered";
import BN from "bn.js";
import { ZERO } from "../lib/util";

export const WelcomePage: FC = () => {
  const sunrise = useSunriseStake({ readOnly: true });
  const [treasuryBalanceLamports, setTreasuryBalanceLamports] = useState<BN>();

  const updateBalances = useCallback(async () => {
    if (!sunrise.stakeAccount) return;
    setTreasuryBalanceLamports(await sunrise.stakeAccount.treasuryBalance());
  }, [sunrise.stakeAccount]);

  useEffect((): void => {
    if (!sunrise.stakeAccount) return;
    updateBalances().catch(console.error);
  }, [updateBalances, sunrise.stakeAccount]);

  return (
    <div className="w-full">
      {!sunrise.stakeAccount && <Spinner />}
      <img
        className="h-25 w-auto m-auto py-2"
        src={"./logo.png"}
        alt="Sunrise"
      />
      <CarbonRecovered
        treasuryBalanceLamports={treasuryBalanceLamports ?? ZERO}
      />
    </div>
  );
};
