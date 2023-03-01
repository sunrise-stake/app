import clx from "classnames";
import { type FC } from "react";

const GrowApp: FC<
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }) => {
  return (
    <div
      className={clx("container flex justify-center items-center", className)}
      {...rest}
    >
      <h2>Grow.</h2>
    </div>
  );
};

export { GrowApp };
