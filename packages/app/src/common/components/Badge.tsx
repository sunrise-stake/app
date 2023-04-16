import clx from "classnames";
import { type ReactNode, type FC } from "react";

interface Props {
  children?: ReactNode | undefined;
  color?: "primary" | "secondary" | "danger" | "ticket";
}

const Badge: FC<Props> = ({ children, color = "secondary" }) => {
  const classNames = clx(
    "inline-flex gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2",
    {
      "bg-danger text-white": color === "danger",
      "bg-green text-white": color === "primary",
      "bg-gray-200 text-gray-700": color === "secondary",
      "bg-ticket text-black": color === "ticket",
    }
  );

  return <span className={classNames}>{children}</span>;
};

export { Badge };
