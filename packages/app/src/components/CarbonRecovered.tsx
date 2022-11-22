import React from "react";
import { toSol } from "../lib/util";
import { solToCarbon } from "./BalanceInfoTable";
import BN from "bn.js";

interface CarbonRecoveredProps {
  treasuryBalanceLamports: BN;
}

const CarbonRecovered: React.FC<CarbonRecoveredProps> = ({
  treasuryBalanceLamports,
}) => {
  return (
    <div className="grid grid-rows-3 items-center justify-center grid-flow-col">
      <div className="flex flex-col justify-center items-center">
        <h4 className="flex-auto font-medium center leading-tight text-1xl grid-row text-neutral-400">
          so far
        </h4>
        <h1 className="font-medium leading-tight text-4xl text-neutral-400">
          {solToCarbon(toSol(treasuryBalanceLamports)).toFixed(2)} tCO₂E
        </h1>
        <h4 className="flex-auto font-medium leading-tight text-xl text-neutral-400">
          carbon recovered
        </h4>
      </div>
    </div>
  );
};

export default CarbonRecovered;
