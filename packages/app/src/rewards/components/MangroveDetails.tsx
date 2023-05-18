import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clx from "classnames";
import React, { type FC, useRef, useState } from "react";

interface Props {
  className?: string;
}
const MangroveDetails: FC<Props> = ({ className }) => {
  const [isShowing, setIsShowing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return (
    <>
      <button
        onClick={() => {
          setIsShowing((isShowing) => {
            clearTimeout(timeoutRef.current);
            if (isShowing) {
              setIsVisible(false);
            } else {
              timeoutRef.current = setTimeout(() => {
                setIsVisible(true);
              }, 700);
            }
            return !isShowing;
          });
        }}
        className={clx(
          "transition duration-700 flex w-full justify-between rounded-t-md py-5 text-left text-lg text-green font-bold ",
          {
            "rounded-t-md backdrop-blur-sm": isShowing,
            "rounded-md": !isShowing,
          }
        )}
      >
        <span>Why are Mangroves important?</span>
        <ChevronDownIcon
          className={clx("transition duration-700 h-5 w-5", {
            "rotate-180 transform": isShowing,
          })}
        />
      </button>

      <div
        className={clx(
          "transition-all duration-1000 py-2 px-4 rounded-b-md text-left overflow-y-hidden",
          {
            "transform h-48 backdrop-blur-sm": isShowing,
            "transform h-0": !isShowing,
            "overflow-y-visible": isVisible,
          },
          className
        )}
      >
        <hr
          className={clx(
            "-mt-1 h-{0.5px} transition-all duration-700 mb-2 w-full bg-white",
            {
              "transform opacity-0": !isShowing,
              "transform opacity-100": isShowing,
            }
          )}
        ></hr>
        <p>
          Mangroves are trees that grow in salt water and are one of the most
          effective carbon sinks on the planet. They are also a critical habitat
          for many species of fish and birds.
        </p>
        <p>
          For more details, visit{" "}
          <a href="https://panasea.io/" target="_blank" rel="noreferrer">
            Panasea
          </a>
        </p>
      </div>
    </>
  );
};

export { MangroveDetails };
