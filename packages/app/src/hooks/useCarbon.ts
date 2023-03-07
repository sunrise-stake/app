import BN from "bn.js";
import { useEffect, useState } from "react";
import { PRICES, solToCarbon, toSol } from "../lib/util";
import { useSunriseStake } from "../context/sunriseStakeContext";
import { useYieldController } from "./useYieldController";

const useCarbon = (): { totalCarbon: number | undefined } => {
  const { details } = useSunriseStake();
  const yieldControllerState = useYieldController();
  const [totalCarbon, setTotalCarbon] = useState<number>();

  useEffect(() => {
    void (async () => {
      if (!details) return;
      // TODO extract to some library
      // Total carbon is the carbon value of
      // 1. the extractable yield
      // 2. the treasury balance
      // 3. the YieldController totalTokensPurchased value

      const extractableYield = details.extractableYield;
      const treasuryBalance = new BN(details.balances.treasuryBalance);
      // no longer used to calculate the amount - can be removed
      // const holdingAccountBalance = new BN(
      //   details.balances.holdingAccountBalance
      // );
      // this is the amount of carbon tokens burned so far by the protocol
      const totalTokensPurchased =
        (yieldControllerState?.totalTokensPurchased ?? new BN(0)).toNumber() /
        10 ** 8; // tokens purchased are stored on-chain in minor denomination

      // this is the current price set in the yield controller for buying carbon tokens
      // TODO use this instead of the hard-coded values to convert SOL to Carbon
      // const price = yieldControllerState?.price ?? 0;

      const totalLamportsWaiting = extractableYield.add(treasuryBalance);

      const carbon =
        solToCarbon(toSol(totalLamportsWaiting)) + totalTokensPurchased;

      console.log({
        extractableYield: toSol(extractableYield),
        treasuryBalance: toSol(treasuryBalance),
        // holdingAccountBalance: toSol(holdingAccountBalance),
        totalLamportsWaiting: toSol(totalLamportsWaiting),
        totalTokensPurchased,
        totalCarbon: carbon,
        prices: PRICES,
      });

      // due to fees, at low values, the total can be negative
      const normalizedCarbon = carbon < 0 ? 0 : carbon;

      setTotalCarbon(normalizedCarbon);
    })();
  }, [details, yieldControllerState]);

  return { totalCarbon };
};

export { useCarbon };
