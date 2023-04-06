import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  type Transaction,
  clusterApiUrl,
} from "@solana/web3.js";

const readonlyWallet = {
  publicKey: Keypair.generate().publicKey,
  signAllTransactions: async (txes: Transaction[]) => txes,
  signTransaction: async (tx: Transaction) => tx,
};

const readonlyProvider = new AnchorProvider(
  new Connection(
    process.env.REACT_APP_SOLANA_NETWORK ?? clusterApiUrl("devnet")
  ),
  readonlyWallet,
  {}
);

export { readonlyProvider, readonlyWallet };
