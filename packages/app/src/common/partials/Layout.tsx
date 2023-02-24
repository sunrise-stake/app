import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { type FC, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import {
  FaBookOpen,
  FaGithub,
  FaGlobeAmericas,
  FaTwitter,
  FaWallet,
} from "react-icons/fa";

import { Panel } from "../components/Panel";

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const wallet = useWallet();

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster />
      <header>
        <div className="container flex justify-end mx-auto py-4">
          <WalletMultiButton startIcon={<FaWallet size={"28px"} />}>
            {!wallet.connected ? (
              <div className="hidden sm:block">Connect Wallet</div>
            ) : null}
          </WalletMultiButton>
        </div>
      </header>
      <main className="grow flex">{children}</main>
      <footer>
        <div className="container mx-auto text-center">
          <Panel className="inline-flex my-4 px-8 py-2 rounded-lg backdrop-blur-sm">
            <a
              className="inline-block mr-4 text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://www.sunrisestake.com/"
              target="_blank"
              rel="noreferrer"
            >
              <FaGlobeAmericas size={32} title="Website" />
            </a>
            <a
              className="inline-block mr-4 text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://docs.sunrisestake.com/"
              target="_blank"
              rel="noreferrer"
            >
              <FaBookOpen size={32} title="Docs" />
            </a>
            <a
              className="inline-block mr-4 text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://twitter.com/sunrisestake"
              target="_blank"
              rel="noreferrer"
            >
              <FaTwitter size={32} title="Twitter" />
            </a>
            <a
              className="inline-block text-green active:text-green-bright focus:text-green-bright hover:text-green-bright"
              href="https://github.com/sunrise-stake"
              target="_blank"
              rel="noreferrer"
            >
              <FaGithub size={32} title="Github" />
            </a>
          </Panel>
        </div>
      </footer>
    </div>
  );
};

export { Layout };
