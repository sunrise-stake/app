import { type FC, type PropsWithChildren, type ReactNode } from "react";
import clx from "classnames";

interface CardProps {
  title?: string;
  image?: ReactNode;
  orientation?: "horizontal" | "vertical";
  size?: "small" | "medium" | "large";
}

export const Card: FC<PropsWithChildren & CardProps> = ({
  children,
  image,
  title,
  orientation = "vertical",
  size = "medium",
}) => (
  <div
    className={clx(
      orientation === "horizontal" && "card-side",
      size === "small"
        ? "w-32 h-32 p-2"
        : size === "medium"
        ? "w-48 h-48 p-4"
        : "w-128 h-128 p-4",
      "card glass"
    )}
  >
    {image !== undefined && <figure className="min-h-2/3">{image}</figure>}
    <div
      className={clx(
        "card-body items-center content-center",
        size === "small" ? "p-1" : size === "medium" ? "p-1" : "p-3"
      )}
    >
      {title !== undefined && (
        <h2
          className={clx(
            "card-title text-center",
            size === "small" && "text-s"
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  </div>
);
