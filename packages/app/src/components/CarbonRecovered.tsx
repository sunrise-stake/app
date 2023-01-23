import React, { FC } from "react";
import { toFixedWithPrecision } from "../lib/util";
import { useCarbon } from "../hooks/useCarbon";

const CarbonRecovered: FC = () => {
  const { totalCarbon } = useCarbon();
  return totalCarbon !== undefined ? (
    <div className="flex flex-col justify-center items-center mb-12">
      <h4 className="flex-auto font-medium center leading-tight text-1xl grid-row text-white">
        so far
      </h4>
      <h1 className="font-medium leading-tight text-4xl text-white">
        {toFixedWithPrecision(totalCarbon)} tCO₂E
      </h1>
      <h4 className="flex-auto font-medium leading-tight text-xl text-white">
        carbon recovered
      </h4>
    </div>
  ) : (
    <></>
  ); // TODO loading screen
};

export default CarbonRecovered;
