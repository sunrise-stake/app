import { type WalletContextState } from "@solana/wallet-adapter-react";

const DEFAULT_CONTEXT: WalletContextState = {
  autoConnect: false,
  connecting: false,
  connected: false,
  disconnecting: false,
  publicKey: null,
  wallet: null,
  wallets: [],
  select() {
    console.error("Wallet not connected");
  },
  connect: async () => Promise.reject(new Error("Wallet not connected")),
  disconnect: async () => Promise.reject(new Error("Wallet not connected")),
  sendTransaction: async () =>
    Promise.reject(new Error("Wallet not connected")),
  signTransaction: async () =>
    Promise.reject(new Error("Wallet not connected")),
  signAllTransactions: async () =>
    Promise.reject(new Error("Wallet not connected")),
  signMessage: async () => Promise.reject(new Error("Wallet not connected")),
};

export { DEFAULT_CONTEXT };
