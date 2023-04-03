import { AnchorProvider } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";

const readonlyWallet = new AnchorProvider(
  new Connection(
    process.env.REACT_APP_SOLANA_NETWORK ?? clusterApiUrl("devnet")
  ),
  {
    publicKey: Keypair.generate().publicKey,
    signAllTransactions: async (txes) => txes,
    signTransaction: async (tx) => tx,
  },
  {}
);

export { readonlyWallet };
