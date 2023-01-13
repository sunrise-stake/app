import clx from "classnames";
import React, { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
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
          "bg-background": variant === "secondary",
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
