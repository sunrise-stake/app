import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { type FC, useMemo } from "react";

import { SunriseProvider } from "./common/context/sunriseStakeContext";
import { ZenModeProvider } from "./common/context/ZenModeContext";
import { ForestProvider } from "./common/context/forestContext";
import { HelpProvider } from "./common/context/HelpContext";
import { Routes } from "./Routes";
import { NFTsProvider } from "./common/context/NFTsContext";
import { cachedRPCFetch } from "./api/cachedRPCFetch";

import "./solana-wallet-adapter.css";

const App: FC = () => {
  const network =
    import.meta.env.REACT_APP_SOLANA_NETWORK !== null
      ? (import.meta.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork)
      : WalletAdapterNetwork.Devnet;
  const endpoint = import.meta.env.REACT_APP_RPC_URL ?? clusterApiUrl(network);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    []
  );

  return (
    <>
      <ConnectionProvider
        endpoint={endpoint}
        config={{
          // cast to any here to avoid type mismatch between node-fetch (used in @solana/web3.js) and native browser
          fetch: cachedRPCFetch as any,
          commitment: "confirmed",
        }}
      >
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <SunriseProvider>
              <NFTsProvider>
                <ForestProvider>
                  <ZenModeProvider>
                    <HelpProvider>
                      <Routes />
                    </HelpProvider>
                  </ZenModeProvider>
                </ForestProvider>
              </NFTsProvider>
            </SunriseProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
};

export default App;
