import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SignerWalletAdapterProps } from "@solana/wallet-adapter-base";
import BN from "bn.js";

export const ZERO = new BN(0);

export const toBN = (n: number): BN => new BN(`${n}`);

export const walletIsConnected = (
  wallet: SparseWalletContextAdapter
): wallet is ConnectedWallet => wallet.connected && wallet.publicKey != null;

const MAX_NUM_PRECISION = 5;

export const toSol = (lamports: BN, precision = MAX_NUM_PRECISION): number =>
  lamports.div(new BN(10).pow(new BN(precision))).toNumber() /
  (LAMPORTS_PER_SOL / 10 ** precision);

// Get the number of decimal places to show in a formatted number
// Min = 0, Max = MAX_NUM_PRECISION
const formatPrecision = (n: number): number =>
  Math.min(
    Math.abs(Math.min(0, Math.ceil(Math.log(n) / Math.log(10)))) + 1,
    MAX_NUM_PRECISION
  );
export const toFixedWithPrecision = (n: number): string =>
  n.toFixed(formatPrecision(n));

interface SparseWallet {
  publicKey: PublicKey;
  signTransaction: SignerWalletAdapterProps["signTransaction"] | undefined;
  signAllTransactions:
    | SignerWalletAdapterProps["signAllTransactions"]
    | undefined;
}

type SparseWalletContextAdapter = Omit<SparseWallet, "publicKey"> & {
  publicKey: PublicKey | null;
  connected: boolean;
};

export type ConnectedWallet = SparseWallet & { connected: true };

// TODO TEMP lookup
export const SOL_PRICE_USD_CENTS = 3300;
export const CARBON_PRICE_USD_CENTS_PER_TONNE = 8021;

export const solToCarbon = (sol: number): number =>
  (sol * SOL_PRICE_USD_CENTS) / CARBON_PRICE_USD_CENTS_PER_TONNE;

export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}
