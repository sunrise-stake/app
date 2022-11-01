import React, { useMemo } from 'react';
import './App.css';
import logo from './logo.svg';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    GlowWalletAdapter,
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    SolletWalletAdapter, TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
    WalletModalProvider,
} from "@solana/wallet-adapter-react-ui";
import {clusterApiUrl} from "@solana/web3.js";
import {GreenStakeWrapper} from "./pages/greenStakeWrapper";
import rainforest from "./pages/rainforest.mp4";

require('./solana-wallet-adapter.css');

const Content = () => <GreenStakeWrapper/>

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
            <video className="fixed right-0 bottom-0 min-w-full min-h-full opacity-50" autoPlay muted loop>
                <source src={rainforest}/>
            </video>
            <div className="fixed right-0 top-0 px-4 py-1 mr-10 mt-4 border border-solid rounded-lg border-current">devnet</div>
            <div className="App">
                <ConnectionProvider endpoint={endpoint}>
                    <WalletProvider wallets={wallets} autoConnect>
                        <WalletModalProvider>
                            <Content />
                        </WalletModalProvider>
                    </WalletProvider>
                </ConnectionProvider>
            </div>
            {/*<div>Logo created by <a href="https://www.designevo.com/" title="Free Online Logo Maker">DesignEvo logo maker</a></div>*/}
        </>
    );
}

export default App;
