import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React, { type FC } from "react";
import {
  FaBookOpen,
  FaGithub,
  FaGlobeAmericas,
  FaTwitter,
  FaWallet,
} from "react-icons/fa";
import { Panel } from "../common/components/Panel";

import { StakeDashboard } from "./pages/StakeDashboard";
import { WelcomePage } from "./pages/WelcomePage";

export const StakingApp: FC = () => {
  const wallet = useWallet();
  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <header className="container flex mt-12 mb-4 px-8">
        <div className="grow text-3xl">
          <img
            className="hidden sm:block w-auto h-16"
            src={"./logo.png"}
            alt="Sunrise"
          />
        </div>
        <div>
          <WalletMultiButton startIcon={<FaWallet size={"28px"} />}>
            {!wallet.connected ? (
              <div className="hidden sm:block">Connect Wallet</div>
            ) : null}
          </WalletMultiButton>
        </div>
      </header>
      <main className="container grow mx-auto px-8">
        <>{wallet.connected ? <StakeDashboard /> : <WelcomePage />}</>
      </main>
      <footer>
        <Panel className="container flex my-4 px-8 py-2 rounded-lg backdrop-blur-sm">
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
      </footer>
    </div>
  );
};
