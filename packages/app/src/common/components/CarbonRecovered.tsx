import React, { type FC } from "react";

import { useCarbon } from "../hooks/useCarbon";
import { toFixedWithPrecision } from "../utils";

const CarbonRecovered: FC = () => {
  const { totalCarbon } = useCarbon();

  return totalCarbon !== undefined ? (
    <div className="flex flex-col justify-center items-center mb-12 text-green">
      <h4 className="flex-auto font-medium center leading-tight text-1xl grid-row">
        so far
      </h4>
      <h1 className="font-medium leading-tight text-4xl">
        {toFixedWithPrecision(totalCarbon)} tCO₂E
      </h1>
      <h4 className="flex-auto font-medium leading-tight text-xl">
        carbon recovered
      </h4>
    </div>
  ) : null;
};

export { CarbonRecovered };
