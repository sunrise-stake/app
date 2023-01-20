import { useSunriseStake } from "../context/sunriseStakeContext";
import { useEffect, useState } from "react";
import BN from "bn.js";
import { HOLDING_ACCOUNT } from "../lib/sunriseClientWrapper";
import { solToCarbon, toSol } from "../lib/util";
import { useConnection } from "@solana/wallet-adapter-react";

export const useCarbon = (): { totalCarbon: number | undefined } => {
  const { connection } = useConnection();
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
        await connection.getBalance(HOLDING_ACCOUNT)
      );

      const totalLamports = extractableYield
        .add(treasuryBalance)
        .add(holdingAccountBalance);

      const totalCarbon = solToCarbon(toSol(totalLamports));

      setTotalCarbon(totalCarbon);
    })();
  }, [details]);

  return { totalCarbon };
};
