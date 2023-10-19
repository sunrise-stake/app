import { forwardRef, type ForwardRefRenderFunction } from "react";

const _YieldApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  return (
    <div className="flex flex-col justify-startq w-full mt-16">
      <div className="flex justify-center">
        <div>Sunrise Stake</div>
        <div>34 Sol</div>
      </div>
      <div className="flex justify-center">
        <div>Yield router</div>
        <div>4 Sol</div>
      </div>
      <div className="flex justify-center">
        <div>Eco token</div>
        <div>4 Sol</div>
      </div>
    </div>
  );
};

const YieldApp = forwardRef(_YieldApp);

export { YieldApp };
