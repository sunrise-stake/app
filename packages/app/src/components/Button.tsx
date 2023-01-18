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
        "inline-flex px-8 py-4 rounded-lg leading-6 text-white text-xl",
        {
          "bg-green": variant === "primary",
          "bg-danger": variant === "danger",
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
