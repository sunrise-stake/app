import React, { useMemo } from "react";
import "./App.css";
import logo from "/logo.png";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { GreenStakeWrapper } from "./pages/greenStakeWrapper";

require("./solana-wallet-adapter.css");

const Content = () => <GreenStakeWrapper />;

function App() {
  const network = WalletAdapterNetwork.Devnet;
  // const endpoint = "http://localhost:8899";
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new SolletWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <>
      <div className="App ">
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
}

export default App;
