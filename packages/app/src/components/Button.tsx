import clx from "classnames";
import React, { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ticket";
  size?: "sm" | "md";
  children?: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  ...rest
}) => {
  return (
    <button
      className={clx(
        "inline-flex rounded-lg leading-6 text-white text-xl shadow-sm disabled:brightness-75 hover:brightness-75",
        {
          "bg-green": variant === "primary",
          "bg-danger": variant === "danger",
          "bg-outset": variant === "secondary",
          "bg-ticket": variant === "ticket",
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
