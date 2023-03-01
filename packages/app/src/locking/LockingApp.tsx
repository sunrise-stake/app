import clx from "classnames";
import { type FC } from "react";
import { Link } from "react-router-dom";

const LockingApp: FC<
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }) => {
  return (
    <div
      className={clx("flex flex-col justify-center items-center", className)}
      {...rest}
    >
      <h2>Lock.</h2>
      <Link to="invalid" className="block text-green">
        A invalid link...
      </Link>
    </div>
  );
};

export { LockingApp };
