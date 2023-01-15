import clx from "classnames";
import React, { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children?: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  ...rest
}) => {
  return (
    <button
      className={clx(
        "px-8 py-4 rounded-lg text-white text-xl",
        {
          "bg-green": variant === "primary",
          "bg-red-400": variant === "danger",
          "bg-outset": variant === "secondary",
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
