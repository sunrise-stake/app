import React, { FC, useMemo } from "react";
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
import { WalletConnectionWrapper } from "./pages/WalletConnectionWrapper";
import { clusterApiUrl } from "@solana/web3.js";

require("./solana-wallet-adapter.css");

const Content: FC = () => <WalletConnectionWrapper />;

const App: FC = () => {
  const network =
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
    WalletAdapterNetwork.Devnet;
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
              <Content />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </div>
    </>
  );
};

export default App;
