import clx from "classnames";
import { type FC } from "react";

const NavArrow: FC<{
  className?: string;
  direction: "up" | "down" | "left" | "right";
}> = ({ className, direction }) => (
  <div
    className={clx(
      "NavArrow",
      `NavArrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
      className
    )}
  ></div>
);

export { NavArrow };
