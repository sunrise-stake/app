import { useState, FC, ReactNode } from "react";
import { usePopper } from "react-popper";
import { Popover } from "@headlessui/react";
import { BsInfoCircle } from "react-icons/bs";

interface TooltipProps {
  children: ReactNode;
}

const TooltipPopover: FC<TooltipProps> = ({ children }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [
      { name: "arrow", options: { element: arrowElement } },
      {
        name: "offset",
        options: {
          offset: [0, 8],
        },
      },
    ],
  });

  return (
    <Popover className="flex">
      <Popover.Button ref={setReferenceElement}>
        <BsInfoCircle />
      </Popover.Button>

      <Popover.Panel
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        className="bg-green px-4 py-2 rounded-md text-xs w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/6 z-50"
      >
        {children}
        <div ref={setArrowElement} style={styles.arrow} />
      </Popover.Panel>
    </Popover>
  );
};

export default TooltipPopover;
