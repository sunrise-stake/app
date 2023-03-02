import clx from "classnames";
import { forwardRef, type ForwardRefRenderFunction } from "react";

const _ForestApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  return (
    <div
      className={clx("flex justify-center items-center", className)}
      {...rest}
      ref={ref}
    >
      <h2>Forest.</h2>
    </div>
  );
};

const ForestApp = forwardRef(_ForestApp);

export { ForestApp };
