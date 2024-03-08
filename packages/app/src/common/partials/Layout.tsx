import { Transition } from "@headlessui/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, type FC, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { BsQuestionCircle } from "react-icons/bs";
import { FaWallet } from "react-icons/fa";
import { PageHelpModal } from "../components/modals/PageHelpModal";

import { useZenMode } from "../context/ZenModeContext";
import { ExternalLinks } from "../components/ExternalLinks";

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const [zenMode] = useZenMode();
  const [showPageHelp, updateShowPageHelp] = useState(false);

  return (
    <>
      <Transition
        className="BGImage -z-10 fixed top-0 left-0 w-screen h-screen"
        show={zenMode.showBGImage}
        unmount={false}
        enterFrom="translate-y-[317px]"
        enterTo="translate-y-0"
        enter="transition-transform duration-500"
        leaveFrom="translate-y-0"
        leaveTo="translate-y-[317px]"
        leave="transition-transform duration-500"
      />
      <Transition
        className="z-10 fixed top-4 right-8"
        show={zenMode.showWallet}
        unmount={false}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity duration-500"
      >
        <WalletMultiButton className="!bg-green hover:!bg-green-light !text-white">
          <FaWallet />
        </WalletMultiButton>
      </Transition>
      <Transition
        className="z-10 fixed bottom-4 right-8 text-green flex items-center"
        show={zenMode.showHelpButton}
        unmount={false}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity duration-500"
      >
        <a
          href="https://www.sunrisestake.com/impressum"
          target="_blank"
          rel="noreferrer"
          className="text-sm mr-2"
        >
          [Legal]
        </a>
        <button
          onClick={() => {
            updateShowPageHelp(!showPageHelp);
          }}
        >
          <BsQuestionCircle
            size={40}
            className="text-green-light w-8 md:w-12"
          />
        </button>
      </Transition>
      <Transition
        className="z-10 fixed bottom-4 left-1/2 md:left-4 -translate-x-32 md:translate-x-0"
        show={zenMode.showExternalLinks}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity duration-500"
      >
        <ExternalLinks />
      </Transition>
      <div className="flex flex-col min-h-screen">
        <Toaster />
        <main className="grow flex">{children}</main>
      </div>
      <PageHelpModal
        show={showPageHelp}
        onClose={() => {
          updateShowPageHelp(false);
        }}
      />
    </>
  );
};

export { Layout };
