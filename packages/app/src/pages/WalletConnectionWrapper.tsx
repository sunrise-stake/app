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
      <div className="container flex mt-12 mb-4">
        <div className="grow text-3xl">
          <img
            className="w-auto h-16 mr-7 inline"
            src={"./logo.png"}
            alt="Sunrise"
          />
        </div>
        <div>
          <WalletMultiButton startIcon={<FaWallet size={"28px"} />}>
            {!wallet.connected ? "Connect Wallet" : null}
          </WalletMultiButton>
        </div>
      </div>
      <div className="container mx-auto px-4">
        <div>{wallet.connected ? <StakeDashboard /> : <WelcomePage />}</div>
      </div>
    </div>
  );
};
