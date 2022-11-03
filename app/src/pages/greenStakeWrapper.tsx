import React, { FC } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { GreenStake } from "./greenStake";
import { useWallet } from "@solana/wallet-adapter-react";
import { GreenStakeWelcomePage } from "./GreenStakeWelcomePage";

export const GreenStakeWrapper: FC = () => {
  const wallet = useWallet();
  return (
    <div className="min-h-full w-full h-screen flex flex-col items-center">
      <div className="w-full flex justify-between px-3  py-1 items-center mt-2 ">
        <div className="flex-grow-0">
          <WalletMultiButton />
        </div>
        <span className="text-lg px-2 py-2 mb-3 inline-block border border-solid rounded-lg border-current">
          devnet
        </span>
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
          {wallet.connected ? <GreenStake /> : <GreenStakeWelcomePage />}
        </div>
      </div>
    </div>
  );
};
