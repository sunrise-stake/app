import clx from "classnames";
import React, { type ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "secondary" | "danger" | "ticket";
  variant?: "solid" | "outline";
  size?: "sm" | "md";
  children?: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  color = "primary",
  size = "md",
  variant = "solid",
  ...rest
}) => (
  <button
    className={clx(
      "inline-flex items-center border-2 rounded-lg leading-6 text-xl shadow-sm disabled:brightness-75 hover:brightness-75",
      {
        "border-green": color === "primary",
        "border-danger": color === "danger",
        "border-outset": color === "secondary",
        "border-ticket": color === "ticket",
        "bg-green": color === "primary" && variant === "solid",
        "bg-danger": color === "danger" && variant === "solid",
        "bg-outset": color === "secondary" && variant === "solid",
        "bg-ticket": color === "ticket" && variant === "solid",
        "bg-transparent": variant === "outline",
        "text-green": color === "primary" && variant === "outline",
        "text-danger": color === "danger" && variant === "outline",
        "text-outset": color === "secondary" && variant === "outline",
        "text-ticket": color === "ticket" && variant === "outline",
        "text-white": variant === "solid",
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

export { Button };
