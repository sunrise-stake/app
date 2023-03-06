import clx from "classnames";
import React, { type ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "secondary" | "danger" | "ticket";
  size?: "sm" | "md";
  children?: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  color = "primary",
  size = "md",
  ...rest
}) => {
  return (
    <button
      className={clx(
        "inline-flex items-center rounded-lg leading-6 text-white text-xl shadow-sm disabled:brightness-75 hover:brightness-75",
        {
          "bg-green": color === "primary",
          "bg-danger": color === "danger",
          "bg-outset": color === "secondary",
          "bg-ticket": color === "ticket",
          "px-8 py-4": size === "md",
          "px-5 py-3": size === "sm",
        },
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export { Button };
