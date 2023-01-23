import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React, { FC } from "react";
import {
  FaBookOpen,
  FaGithub,
  FaGlobeAmericas,
  FaTwitter,
  FaWallet,
} from "react-icons/fa";
import { Panel } from "../components/Panel";

import { StakeDashboard } from "./StakeDashboard";
import { WelcomePage } from "./WelcomePage";

export const WalletConnectionWrapper: FC = () => {
  const wallet = useWallet();
  return (
    <div className="min-h-full w-full flex flex-col items-center">
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
      <main className="container mx-auto px-8">
        <>{wallet.connected ? <StakeDashboard /> : <WelcomePage />}</>
      </main>
      <footer>
        <Panel className="container flex my-4 px-8 py-2 rounded-lg">
          {/* <Panel className="flex flex-row mx-auto mb-9 p-3 sm:p-4"> */}
          <a className="inline-block mr-4" href="https://www.sunrisestake.com/">
            <FaGlobeAmericas size={32} title="Website" />
          </a>
          <a
            className="inline-block mr-4"
            href="https://docs.sunrisestake.com/"
          >
            <FaBookOpen size={32} title="Docs" />
          </a>
          <a
            className="inline-block mr-4"
            href="https://github.com/sunrise-stake"
          >
            <FaTwitter size={32} title="Twitter" />
          </a>
          <a
            className="inline-block mr-4"
            href="https://github.com/sunrise-stake"
          >
            <FaGithub size={32} title="Github" />
          </a>
        </Panel>
      </footer>
    </div>
  );
};
