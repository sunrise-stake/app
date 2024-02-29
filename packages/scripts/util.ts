import os from "os";
import {Cluster, clusterApiUrl, PublicKey} from "@solana/web3.js";
import {AnchorProvider} from "@coral-xyz/anchor";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL =
  process.env.ANCHOR_PROVIDER_URL ?? clusterApiUrl((process.env.REACT_APP_SOLANA_NETWORK  || 'devnet') as Cluster);
process.env.ANCHOR_WALLET = process.env.ANCHOR_WALLET ?? idWallet;

export const readOnlyProvider = (publicKey: PublicKey): AnchorProvider => {
    const envProvider = AnchorProvider.env();
    return new AnchorProvider(
        envProvider.connection,
        {
            publicKey,
            signTransaction: () => Promise.reject(new Error("Read-only wallet")),
            signAllTransactions: () => Promise.reject(new Error("Read-only wallet")),
        },
        envProvider.opts,
    );
}
