import { Popover } from "@headlessui/react";
import { useState, type FC, type ReactNode } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { usePopper } from "react-popper";

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
    <Popover>
      <Popover.Button ref={setReferenceElement}>
        <BsInfoCircle size={14} />
      </Popover.Button>

      <Popover.Panel
        ref={setPopperElement}
        style={styles.popper}
        className="bg-green px-4 py-2 rounded-md text-xs min-w-[120px] sm:min-w-[160px] w-1/2 md:w-1/3 z-50"
        {...attributes.popper}
      >
        {children}
        <div ref={setArrowElement} style={styles.arrow} />
      </Popover.Panel>
    </Popover>
  );
};

export { TooltipPopover };
