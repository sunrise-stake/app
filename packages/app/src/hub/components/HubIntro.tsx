import { Transition } from "@headlessui/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { type FC } from "react";

import { CarbonRecovered } from "../../common/components";
import { Carousel } from "./Carousel";
import { AiOutlineArrowRight, AiOutlineArrowLeft } from "react-icons/ai";

const HubIntro: FC<{
  show: boolean;
  onEntered?: () => void;
  onLeft?: () => void;
}> = ({ show, onEntered, onLeft }) => {
  const CarouselData = [
    {
      image: "https://picsum.photos/300/300",
    },
    {
      image: "https://picsum.photos/1200/800",
    },
    {
      image: "https://picsum.photos/720/720",
    },
    {
      image: "https://picsum.photos/1920/1080",
    },
    {
      image: "https://picsum.photos/480/360",
    },
  ];

  return (
    <Transition
      show={show}
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
      <Carousel
        data={CarouselData}
        autoPlay={false}
        rightItem={<AiOutlineArrowRight size={24} />}
        leftItem={<AiOutlineArrowLeft size={24} />}
        animationDuration={10}
        size="normal"
      />
      <Transition.Child
        className="my-12"
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
        <CarbonRecovered />
      </Transition.Child>
    </Transition>
  );
};

export { HubIntro };
