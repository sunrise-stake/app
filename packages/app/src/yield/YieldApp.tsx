import { forwardRef, type ForwardRefRenderFunction } from "react";
import AccountBalance from "./AccountBalance";

const _YieldApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  return (
    <div className="flex flex-col justify-start w-full mt-16">
      <AccountBalance title="Sunrise Stake" balance="45" />
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
