import clx from "classnames";
import { FC, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

const InfoBox: FC<Props> = ({ children, className }) => (
  <div
    className={clx(
      "bg-green-light/30 border border-green-light backdrop-blur-md",
      className
    )}
  >
    {children}
  </div>
);

export { InfoBox };
