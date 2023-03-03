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
import {
  type FC,
  type MutableRefObject,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
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
import { debounce } from "./common/utils";
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
  const appRefs = {
    forest: useRef<null | HTMLDivElement>(null),
    grow: useRef<null | HTMLDivElement>(null),
    hub: useRef<null | HTMLDivElement>(null),
    locking: useRef<null | HTMLDivElement>(null),
    lost: useRef<null | HTMLDivElement>(null),
    staking: useRef<null | HTMLDivElement>(null),
  };
  const [currentRouteApp, setCurrentRouteApp] =
    useState<null | MutableRefObject<null | HTMLDivElement>>(null);
  window.addEventListener(
    "resize",
    debounce(() => {
      currentRouteApp?.current?.scrollIntoView();
    }, 100),
    { passive: true }
  );

  useLayoutEffect(() => {
    appRefs.hub.current?.scrollIntoView();
  }, [appRefs.hub]);

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
                          appRefs.hub.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                          setCurrentRouteApp(appRefs.hub);
                        },
                      },
                      {
                        path: "/forest",
                        onMatch: () => {
                          appRefs.forest.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                          setCurrentRouteApp(appRefs.forest);
                        },
                      },
                      {
                        path: "/grow",
                        onMatch: () => {
                          appRefs.grow.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                          setCurrentRouteApp(appRefs.grow);
                        },
                      },
                      {
                        path: "/lock",
                        onMatch: () => {
                          appRefs.locking.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                          setCurrentRouteApp(appRefs.locking);
                        },
                      },
                      {
                        path: "/stake",
                        onMatch: () => {
                          appRefs.staking.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                          setCurrentRouteApp(appRefs.staking);
                        },
                      },
                      {
                        path: "/*",
                        onMatch: () => {
                          appRefs.lost.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                          setCurrentRouteApp(appRefs.lost);
                        },
                      },
                    ]}
                  />
                  <div className="AppGrid">
                    <ForestApp
                      id="forest-app"
                      className="App ForestApp"
                      ref={appRefs.forest}
                    />
                    <GrowApp
                      id="grow-app"
                      className="App GrowApp"
                      ref={appRefs.grow}
                    />
                    <HubApp
                      id="hub-app"
                      className="App HubApp"
                      ref={appRefs.hub}
                    />
                    <LockingApp
                      id="locking-app"
                      className="App LockingApp"
                      ref={appRefs.locking}
                    />
                    <StakingApp
                      id="staking-app"
                      className="App StakingApp"
                      ref={appRefs.staking}
                    />
                    <div
                      id="lost-app"
                      className="App LostApp flex flex-col min-h-screen justify-center items-center"
                      ref={appRefs.lost}
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
