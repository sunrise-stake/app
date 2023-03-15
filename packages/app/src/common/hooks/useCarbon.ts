import { toSol } from "@sunrisestake/client";
import BN from "bn.js";
import { useEffect, useState } from "react";

import { useSunriseStake } from "../context/sunriseStakeContext";
import { solToCarbon } from "../utils";

const useCarbon = (): {
  totalCarbon: number | undefined;
  extractedCarbon: number | undefined;
} => {
  const { details, yieldControllerState } = useSunriseStake();
  const [totalCarbon, setTotalCarbon] = useState<number>();
  const [extractedCarbon, setExtractedCarbon] = useState<number>();

  useEffect(() => {
    void (async () => {
      let totalTokensPurchased;
      if (yieldControllerState) {
        totalTokensPurchased =
          (yieldControllerState?.totalTokensPurchased ?? new BN(0)).toNumber() /
          10 ** 8; // tokens purchased are stored on-chain in minor denomination
        setExtractedCarbon(totalTokensPurchased);

        if (details) {
          // TODO extract to some library
          // Total carbon is the carbon value of
          // 1. the extractable yield
          // 2. the treasury balance
          // 3. the YieldController totalTokensPurchased value

          const extractableYield = details.extractableYield;
          const treasuryBalance = new BN(details.balances.treasuryBalance);
          // no longer used to calculate the amount - can be removed
          const holdingAccountBalance = new BN(
            details.balances.holdingAccountBalance
          );
          // this is the current price set in the yield controller for buying carbon tokens
          // TODO use this instead of the hard-coded values to convert SOL to Carbon
          // const price = yieldControllerState?.price ?? 0;

          const totalLamportsWaiting = extractableYield.add(treasuryBalance);

          const carbon =
            solToCarbon(toSol(totalLamportsWaiting)) + totalTokensPurchased;

          console.log({
            extractableYield: toSol(extractableYield),
            treasuryBalance: toSol(treasuryBalance),
            holdingAccountBalance: toSol(holdingAccountBalance),
            totalLamportsWaiting: toSol(totalLamportsWaiting),
            totalTokensPurchased,
            totalCarbon: carbon,
          });

          // due to fees, at low values, the total can be negative
          const normalizedCarbon = carbon < 0 ? 0 : carbon;

          setTotalCarbon(normalizedCarbon);
        }
      }
    })();
  }, [details, yieldControllerState]);

  return { totalCarbon, extractedCarbon };
};

export { useCarbon };
