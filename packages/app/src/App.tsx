import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import React, { type FC, useMemo } from "react";
import { RouterProvider, createBrowserRouter, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { SunriseProvider } from "./common/context/sunriseStakeContext";
import { StakingApp } from "./staking/StakingApp";
require("./solana-wallet-adapter.css");

const router = createBrowserRouter([
  {
    path: "/",
    element: <StakingApp />,
    errorElement: (
      <div className="flex flex-col min-h-screen justify-center items-center">
        <p className="text-2xl font-bold">
          Oh, oh. You&apos;ve got lost in the woods... 🐺
        </p>
        <Link
          className="mt-2 px-5 py-3 border-2 border-green rounded-lg leading-6 text-green text-xl"
          to="/"
        >
          Back home
        </Link>
      </div>
    ),
  },
]);

const App: FC = () => {
  const network =
    process.env.REACT_APP_SOLANA_NETWORK !== null
      ? (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork)
      : WalletAdapterNetwork.Devnet;
  const endpoint = process.env.REACT_APP_RPC_URL ?? clusterApiUrl(network);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <>
      <div className="App min-h-screen text-white">
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <SunriseProvider>
                <Toaster />
                <RouterProvider router={router} />
              </SunriseProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </div>
    </>
  );
};

export default App;
