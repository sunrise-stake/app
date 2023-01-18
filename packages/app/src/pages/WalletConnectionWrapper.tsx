import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React, { FC } from "react";
import { FaWallet } from "react-icons/fa";

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
    </div>
  );
};
