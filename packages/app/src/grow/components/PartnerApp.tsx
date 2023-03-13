import clx from "classnames";
import { type FC, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

const PartnerApp: FC<Props> = ({ children, className }) => (
  <div
    className={clx(
      "bg-green backdrop-blur-sm bg-opacity-20 border border-green",
      className
    )}
  >
    {children}
  </div>
);

export { PartnerApp };
