import clx from "classnames";
import { type FC, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

const InfoBox: FC<Props> = ({ children, className }) => (
  <div
    className={clx(
      "bg-green-light/20 border border-green-light backdrop-blur-md text-green-light",
      className
    )}
  >
    {children}
  </div>
);

export { InfoBox };
