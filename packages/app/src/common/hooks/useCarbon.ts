import { toSol } from "@sunrisestake/client";
import BN from "bn.js";
import { useEffect, useState } from "react";

import { useSunriseStake } from "../context/sunriseStakeContext";
import { solToCarbon } from "../utils";

const useCarbon = (): { totalCarbon: number | undefined } => {
  const { details } = useSunriseStake();
  const [totalCarbon, setTotalCarbon] = useState<number>();

  useEffect(() => {
    void (async () => {
      if (!details) return;
      // TODO extract to some library
      // Total carbon is the carbon value of
      // 1. the extractable yield
      // 2. the treasury balance
      // 3. the holding account balance
      // (TODO this last one will be replaced with the TreasuryController total_spent value)

      const extractableYield = details.extractableYield;
      const treasuryBalance = new BN(details.balances.treasuryBalance);
      const holdingAccountBalance = new BN(
        details.balances.holdingAccountBalance
      );

      const totalLamports = extractableYield
        .add(treasuryBalance)
        .add(holdingAccountBalance);

      const carbon = solToCarbon(toSol(totalLamports));

      console.log({
        extractableYield: toSol(extractableYield),
        treasuryBalance: toSol(treasuryBalance),
        holdingAccountBalance: toSol(holdingAccountBalance),
        totalLamports: toSol(totalLamports),
        totalCarbon: carbon,
      });

      // due to fees, at low values, the total can be negative
      const normalizedCarbon = carbon < 0 ? 0 : carbon;

      setTotalCarbon(normalizedCarbon);
    })();
  }, [details]);

  return { totalCarbon };
};

export { useCarbon };
