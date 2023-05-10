import clx from "classnames";
import React, { type MouseEventHandler, type ReactNode } from "react";
import { type ModalControl } from "../hooks";
import { InfoModal } from "./modals/InfoModal";
import { useInfoModal } from "../hooks/useInfoModal";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "secondary" | "danger" | "ticket" | "white";
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  className?: string;
  infoDisabled?: boolean;
  disabledTitle?: string;
  disabledMessage?: string;
}

// Execute the onClick only if the condition is true, otherwise show the modal
const orShowModal =
  (
    condition: boolean,
    executeIfTrue: MouseEventHandler,
    modalIfFalse: ModalControl
  ): MouseEventHandler =>
  (event) => {
    if (condition) {
      executeIfTrue(event);
    } else {
      modalIfFalse.trigger();
    }
  };

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  color = "primary",
  size = "md",
  variant = "solid",
  infoDisabled = false,
  disabledTitle = "",
  disabledMessage = "",
  onClick,
  ...rest
}) => {
  const infoModal = useInfoModal();
  const wrappedOnClick =
    onClick !== undefined
      ? orShowModal(!infoDisabled, onClick, infoModal)
      : undefined;
  return (
    <button
      onClick={wrappedOnClick}
      className={clx(
        "inline-flex items-center border-2 rounded-lg leading-6 shadow-sm disabled:brightness-75",
        infoDisabled ? "brightness-75" : "hover:brightness-125",
        {
          "border-green": color === "primary",
          "hover:border-green-light": color === "primary" && !infoDisabled,
          "border-danger": color === "danger",
          "border-outset": color === "secondary",
          "border-ticket": color === "ticket",
          "border-white": color === "white",
          "bg-green": color === "primary" && variant === "solid",
          "hover:bg-green-light":
            color === "primary" && variant === "solid" && !infoDisabled,
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
      <InfoModal
        title={disabledTitle}
        message={disabledMessage}
        ok={infoModal.onModalOK}
        show={infoModal.modalShown}
      />
      {children}
    </button>
  );
};

export { Button };
