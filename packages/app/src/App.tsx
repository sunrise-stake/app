import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import React, { type FC, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

import { SunriseProvider } from "./common/context/sunriseStakeContext";
import { Layout } from "./common/partials/Layout";
import { HubApp } from "./hub/HubApp";
import { ForestApp } from "./forest/ForestApp";
import { GrowApp } from "./grow/GrowApp";
import { LockingApp } from "./locking/LockingApp";
import { StakingApp } from "./staking/StakingApp";
import { BGImageProvider } from "./common/context/BGImageContext";
import { EventRouter } from "./common/container/EventRouter";
require("./solana-wallet-adapter.css");

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
  const location = useLocation();

  return (
    <>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets}>
          <WalletModalProvider>
            <SunriseProvider>
              <BGImageProvider>
                <Layout>
                  <EventRouter
                    location={location}
                    routes={[
                      {
                        path: "/",
                        onMatch: () => {
                          document
                            .getElementById("hub-app")
                            ?.scrollIntoView({ behavior: "smooth" });
                        },
                      },
                      {
                        path: "/forest",
                        onMatch: () => {
                          document
                            .getElementById("forest-app")
                            ?.scrollIntoView({ behavior: "smooth" });
                        },
                      },
                      {
                        path: "/grow",
                        onMatch: () => {
                          document
                            .getElementById("grow-app")
                            ?.scrollIntoView({ behavior: "smooth" });
                        },
                      },
                      {
                        path: "/lock",
                        onMatch: () => {
                          document
                            .getElementById("locking-app")
                            ?.scrollIntoView({ behavior: "smooth" });
                        },
                      },
                      {
                        path: "/stake",
                        onMatch: () => {
                          document
                            .getElementById("staking-app")
                            ?.scrollIntoView({ behavior: "smooth" });
                        },
                      },
                      {
                        path: "/grow",
                        onMatch: () => {
                          document
                            .getElementById("grow-app")
                            ?.scrollIntoView({ behavior: "smooth" });
                        },
                      },
                      {
                        path: "/*",
                        onMatch: () => {
                          document
                            .getElementById("lost-app")
                            ?.scrollIntoView({ behavior: "smooth" });
                        },
                      },
                    ]}
                  />
                  <div className="AppGrid">
                    <ForestApp id="forest-app" className="App ForestApp" />
                    <GrowApp id="grow-app" className="App GrowApp" />
                    <HubApp id="hub-app" className="App HubApp" />
                    <LockingApp id="locking-app" className="App LockingApp" />
                    <StakingApp id="staking-app" className="App StakingApp" />
                    <div
                      id="lost-app"
                      className="App LostApp flex flex-col min-h-screen justify-center items-center"
                    >
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
                  </div>
                </Layout>
              </BGImageProvider>
            </SunriseProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};

export default App;
