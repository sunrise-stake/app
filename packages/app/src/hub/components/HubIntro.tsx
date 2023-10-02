import { Transition } from "@headlessui/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { type FC } from "react";

import { CarbonRecovered, LogoIcon, LogoText } from "../../common/components";

const HubIntro: FC<{
  show: boolean;
  onEnter?: () => void;
  onEntered?: () => void;
  onLeft?: () => void;
}> = ({ show, onEnter, onEntered, onLeft }) => {
  return (
    <Transition
      show={show}
      beforeEnter={() => {
        if (onEnter) onEnter();
      }}
      afterEnter={() => {
        if (onEntered) onEntered();
      }}
      afterLeave={() => {
        if (onLeft) onLeft();
      }}
    >
      <div className="flex justify-center items-center">
        <Transition.Child
          className="mr-2"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          enter="transition-opacity ease-in duration-1000"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          leave="transition-opacity ease-out duration-500"
        >
          <LogoIcon className={"block w-auto h-32"} />
        </Transition.Child>
        <Transition.Child
          enterFrom="opacity-0"
          enterTo="opacity-100"
          enter="transition-opacity ease-in duration-1000 delay-1000"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          leave="transition-opacity ease-out duration-500"
        >
          <Transition.Child
            enterFrom="-translate-x-2"
            enterTo="translate-x-0"
            enter="transition-transform ease-in duration-500 delay-1000"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-2"
            leave="transition-transform ease-out duration-250"
          >
            <LogoText className={"block w-auto h-20"} />
          </Transition.Child>
        </Transition.Child>
      </div>
      <Transition.Child
        enterFrom="translate-y-8"
        enterTo="translate-y-0"
        enter="transition-transform duration-1000 delay-1000"
      >
        <Transition.Child
          as="h2"
          className="mt-4 mb-10 font-normal text-lg sm:text-3xl"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          enter="transition-opacity ease-in duration-1000 delay-1000"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          leave="transition-opacity ease-out duration-500"
        >
          Offset emissions while you sleep.
        </Transition.Child>
      </Transition.Child>
      <Transition.Child
        className="mb-12"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity ease-in duration-1000 delay-[2s]"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity ease-out duration-500"
      >
        <WalletMultiButton className="!bg-green hover:!bg-green-light !text-white">
          Start reducing CO<sub>2</sub>&nbsp;emissions
        </WalletMultiButton>
        <CarbonRecovered />
      </Transition.Child>
    </Transition>
  );
};

export { HubIntro };
