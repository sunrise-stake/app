import React, { FC } from "react";
import { solToCarbon, toFixedWithPrecision, toSol } from "../lib/util";
import BN from "bn.js";
import { useSunriseStake } from "../context/sunriseStakeContext";

const CarbonRecovered: FC = () => {
  const { details } = useSunriseStake();
  return details ? (
    <div className="grid grid-rows-3 items-center justify-center grid-flow-col">
      <div className="flex flex-col justify-center items-center">
        <h4 className="flex-auto font-medium center leading-tight text-1xl grid-row text-neutral-400">
          so far
        </h4>
        <h1 className="font-medium leading-tight text-4xl text-neutral-400">
          {toFixedWithPrecision(
            solToCarbon(
              toSol(
                new BN(details.balances.treasuryBalance).add(
                  details.extractableYield
                )
              )
            )
          )}{" "}
          tCO₂E
        </h1>
        <h4 className="flex-auto font-medium leading-tight text-xl text-neutral-400">
          carbon recovered
        </h4>
      </div>
    </div>
  ) : (
    <></>
  ); // TODO loading screen
};

export default CarbonRecovered;
