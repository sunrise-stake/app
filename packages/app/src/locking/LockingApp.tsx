import clx from "classnames";
import { type FC } from "react";

const LockingApp: FC<
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }) => {
  return (
    <div
      className={clx("container flex justify-center items-center", className)}
      {...rest}
    >
      <h2>Lock.</h2>
    </div>
  );
};

export { LockingApp };
