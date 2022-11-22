import React, { FC } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { StakeDashboard } from "./StakeDashboard";
import { useWallet } from "@solana/wallet-adapter-react";
import { WelcomePage } from "./WelcomePage";

export const WalletConnectionWrapper: FC = () => {
  const wallet = useWallet();
  return (
    <div className="min-h-full w-full flex flex-col items-center">
      <div className="w-full flex justify-between px-3  py-1 items-center mt-2 ">
        <div className="flex-grow-0">
          <WalletMultiButton />
        </div>
      </div>
      <div className="container mx-auto px-4">
        <div>
          <div>
            <img
              className="h-25 w-auto m-auto py-2"
              src={"./logo.png"}
              alt="Sunrise"
            />
          </div>
          {wallet.connected ? <StakeDashboard /> : <WelcomePage />}
        </div>
      </div>
    </div>
  );
};
