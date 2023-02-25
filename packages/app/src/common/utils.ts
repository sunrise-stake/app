import { LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import { type SignerWalletAdapterProps } from "@solana/wallet-adapter-base";
import { MAX_NUM_PRECISION } from "@sunrisestake/client";
import BN from "bn.js";

const ZERO = new BN(0);

const toBN = (n: number): BN => new BN(`${n}`);

const walletIsConnected = (
  wallet: SparseWalletContextAdapter
): wallet is ConnectedWallet => wallet.connected && wallet.publicKey != null;

type UIMode = "STAKE" | "UNSTAKE" | "LOCK";

const solToLamports = (sol: number | string): BN => {
  // handle very big numbers but also integers.
  // note this doesn't handle large numbers with decimals.
  // in other words, if you ask for eg a withdrawal of 1e20 SOL + 0.1 SOL, it will round that to 1e20 SOL.TODO fix this later.
  // Math.floor does not work nicely with very large numbers, so we use string formatting (!) to remove the decimal point.

  const formattedNum =
    typeof sol === "string" && Number(sol) > 1_000_000_000
      ? (BigInt(sol.replace(/\..*$/, "")) * BigInt(LAMPORTS_PER_SOL)).toString()
      : Math.floor(Number(sol) * LAMPORTS_PER_SOL).toString();

  // cast to string to avoid error with BN if the number is too high
  return new BN(formattedNum);
};

// Get the number of decimal places to show in a formatted number
// Min = 0, Max = MAX_NUM_PRECISION
const formatPrecision = (n: number, precision = MAX_NUM_PRECISION): number =>
  Math.min(
    Math.abs(Math.min(0, Math.ceil(Math.log(n) / Math.log(10)))) + 1,
    precision
  );

const toFixedWithPrecision = (
  n: number,
  precision = MAX_NUM_PRECISION
): string => n.toFixed(formatPrecision(n, precision));

const getDigits = (strNo: string): number | undefined => {
  const match = strNo.match(/^\d*\.(\d+)$/);
  if (match?.[1] != null) return match[1].length;
};

interface SparseWallet {
  publicKey: PublicKey;
  signTransaction?: SignerWalletAdapterProps["signTransaction"];
  signAllTransactions?: SignerWalletAdapterProps["signAllTransactions"];
}

type SparseWalletContextAdapter = Omit<SparseWallet, "publicKey"> & {
  publicKey: PublicKey | null;
  connected: boolean;
};

type ConnectedWallet = SparseWallet & { connected: true };

// TODO TEMP lookup
const SOL_PRICE_USD_CENTS = 2500;
const CARBON_PRICE_USD_CENTS_PER_TONNE = 173; // NCT price in USD cents

const solToCarbon = (sol: number): number =>
  (sol * SOL_PRICE_USD_CENTS) / CARBON_PRICE_USD_CENTS_PER_TONNE;

function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

const toShortBase58 = (address: PublicKey): string =>
  `${address.toBase58().slice(0, 4)}…${address.toBase58().slice(-4)}`;

const addUp = <K extends string, T extends { [key in K]: number }>(
  key: K,
  arr: T[]
): number => arr.reduce((acc, val) => acc + val[key], 0);
const round = (number: number, decimals: number = 2): number =>
  parseFloat(number.toFixed(decimals));

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);
const rangeTo = (end: number): number[] => range(0, end);

export {
  addUp,
  round,
  ZERO,
  CARBON_PRICE_USD_CENTS_PER_TONNE,
  SOL_PRICE_USD_CENTS,
  type UIMode,
  debounce,
  getDigits,
  solToCarbon,
  solToLamports,
  toBN,
  toFixedWithPrecision,
  walletIsConnected,
  rangeTo,
  toShortBase58,
};
