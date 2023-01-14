import clx from "classnames";
import React, { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "green" | "red" | "unactive";
  children?: ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "green",
  ...rest
}) => {
  return (
    <button
      className={clx(
        "px-8 py-4 rounded-lg text-white text-xl",
        {
          "bg-green": variant === "green",
          "bg-red-400": variant === "red",
          "bg-outset": variant === "unactive",
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
