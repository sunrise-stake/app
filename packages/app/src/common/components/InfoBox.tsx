import clx from "classnames";
import { type FC, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

const InfoBox: FC<Props> = ({ children, className }) => (
  <div
    className={clx(
      "border border-green-light text-green-light bg-white/50 backdrop-blur-sm",
      className
    )}
  >
    {children}
  </div>
);

export { InfoBox };
