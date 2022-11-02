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
        <span className=" px-2 py-2 mb-3 inline-block border border-solid rounded-lg border-current">
          devnet
        </span>
      </div>
      <div className="flex flex-1 flex-col py-6 px-4 sm:px-6 lg:flex-none lg:px-12 xl:px-16 bg-white/70 items-center rounded-2xl">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <img
              className="h-48 w-auto m-auto pb-4"
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
