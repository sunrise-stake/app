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
        <div className="container flex my-4 px-8 py-2 rounded-lg">
          <a
            className="inline-block mr-4 text-[#AAA]"
            href="https://www.sunrisestake.com/"
            target="_blank"
            rel="noreferrer"
          >
            <FaGlobeAmericas size={32} title="Website" />
          </a>
          <a
            className="inline-block mr-4 text-[#AAA]"
            href="https://docs.sunrisestake.com/"
            target="_blank"
            rel="noreferrer"
          >
            <FaBookOpen size={32} title="Docs" />
          </a>
          <a
            className="inline-block mr-4 text-[#AAA]"
            href="https://twitter.com/sunrisestake"
            target="_blank"
            rel="noreferrer"
          >
            <FaTwitter size={32} title="Twitter" />
          </a>
          <a
            className="inline-block text-[#AAA]"
            href="https://github.com/sunrise-stake"
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub size={32} title="Github" />
          </a>
        </div>
      </footer>
    </div>
  );
};
