import clx from "classnames";
import { type FC, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

const Panel: FC<Props> = ({ children, className }) => (
  <div className={clx("bg-inset/60 border border-inset-border", className)}>
    {children}
  </div>
);

export { Panel };
