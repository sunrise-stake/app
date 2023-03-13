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
        className="z-10 fixed top-0 right-0 mt-4 mr-8"
        show={zenMode.showWallet}
        unmount={false}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity duration-500"
      >
        <WalletMultiButton>
          <FaWallet />
        </WalletMultiButton>
      </Transition>
      <Transition
        className="z-10 fixed bottom-0 right-0 mb-4 mr-8"
        show={zenMode.showHelpButton}
        unmount={false}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity duration-500"
      >
        <button
          onClick={() => {
            updateShowPageHelp(!showPageHelp);
          }}
        >
          <BsQuestionCircle
            size={48}
            className="text-green-light w-4 md:w-12"
          />
        </button>
      </Transition>
      <Transition
        className="z-10 fixed bottom-0 left-5 mb-4 mr-8"
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
        <header>
          {/* <audio className="fixed top-0 right-0" loop autoPlay controls>
            <source src="meydan-surreal-forest.mp3" type="audio/mpeg" />
          </audio> */}
        </header>
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
