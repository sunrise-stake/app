import clx from "classnames";
import { type FC } from "react";

const ForestApp: FC<
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }) => {
  return (
    <div
      className={clx("container flex justify-center items-center", className)}
      {...rest}
    >
      <h2>Forest.</h2>
    </div>
  );
};

export { ForestApp };
