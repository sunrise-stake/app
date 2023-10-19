import { forwardRef, type ForwardRefRenderFunction } from "react";
import AccountBalance from "./AccountBalance";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { type Details } from "@sunrisestake/client";
import BN from "bn.js";
import { lamportsToDisplay } from "../common/utils";

const _YieldApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const {
    details,
  }: {
    details: Details | undefined;
  } = useSunriseStake();

  if (details == null) return <>Loading...</>;

  const extractableYield = new BN(
    Math.max(details.extractableYield.toNumber(), 0)
  );

  return (
    <div className="flex flex-col justify-start w-full mt-16">
      <AccountBalance
        title="Sunrise Stake"
        balance={lamportsToDisplay(extractableYield)}
      />
      <AccountBalance title="Yield Router" balance="5" />
      <div className="flex justify-center gap-16">
        <div className="flex flex-col">
          <AccountBalance title="Eco Token Escrow" balance="0.8" />
          <AccountBalance title="Eco Token" balance="0.8" />
        </div>
        <AccountBalance title="Offset Bridge" balance="15" />
      </div>
    </div>
  );
};

const YieldApp = forwardRef(_YieldApp);

export { YieldApp };
