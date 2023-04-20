import clx from "classnames";
import React, { type ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "secondary" | "danger" | "ticket" | "white";
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
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
      "inline-flex items-center border-2 rounded-lg leading-6 shadow-sm disabled:brightness-75 hover:brightness-125",
      {
        "border-green hover:border-green-light": color === "primary",
        "border-danger": color === "danger",
        "border-outset": color === "secondary",
        "border-ticket": color === "ticket",
        "border-white": color === "white",
        "bg-green hover:bg-green-light":
          color === "primary" && variant === "solid",
        "bg-danger": color === "danger" && variant === "solid",
        "bg-outset": color === "secondary" && variant === "solid",
        "bg-ticket": color === "ticket" && variant === "solid",
        "bg-white": color === "white" && variant === "solid",
        "bg-transparent": variant === "outline",
        "text-green hover:text-green-light":
          color === "primary" && variant === "outline",
        "text-danger": color === "danger" && variant === "outline",
        "text-outset": color === "secondary" && variant === "outline",
        "text-ticket": color === "ticket" && variant === "outline",
        "text-white": variant === "solid" && color !== "white",
        "text-green": color === "white",
        "px-8 py-4 text-2xl": size === "lg",
        "px-8 py-4 text-xl": size === "md",
        "px-5 py-3 text-xl": size === "sm",
      },
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

export { Button };
