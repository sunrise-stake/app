import { Transition } from "@headlessui/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { type FC } from "react";

import { CarbonRecovered } from "../../common/components";
import { Link } from "react-router-dom";

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
      <Transition.Child
        as="img"
        className="block w-auto h-16 mx-auto mb-3"
        src="./logo.png"
        alt="Sunrise"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity ease-in duration-1000 delay-1000"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity ease-out duration-500"
      />
      <Transition.Child
        as="h1"
        className="text-green-light font-bold text-4xl sm:text-6xl"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity ease-in duration-1000"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity ease-out duration-500"
      >
        Sunrise Stake
      </Transition.Child>
      <Transition.Child
        enterFrom="translate-y-8"
        enterTo="translate-y-0"
        enter="transition-transform duration-1000 delay-1000"
      >
        <Transition.Child
          as="h2"
          className="mb-16 font-normal text-lg sm:text-3xl"
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
        <WalletMultiButton>
          Start reducing CO<sub>2</sub>&nbsp;emissions
        </WalletMultiButton>
        <div className="mt-8">
          <Link to="/driptip">Ugly Link Sunrise x DRiP</Link>
        </div>
        <CarbonRecovered />
      </Transition.Child>
    </Transition>
  );
};

export { HubIntro };
