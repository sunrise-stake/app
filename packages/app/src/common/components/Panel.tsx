import clx from "classnames";
import { type FC, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

const Panel: FC<Props> = ({ children, className }) => (
  <div className={clx("bg-inset/5 backdrop-blur-sm", className)}>
    {children}
  </div>
);

export { Panel };
