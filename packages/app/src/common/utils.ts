import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { type SignerWalletAdapterProps } from "@solana/wallet-adapter-base";
import { MAX_NUM_PRECISION, toSol } from "@sunrisestake/client";
import BN from "bn.js";
import {
  NotificationType,
  notifyTransaction,
} from "./components/notifications";

const ZERO = new BN(0);

export const ASSETS = "https://api.sunrisestake.com/assets/tree/lores/";

const noop = (): null => null;

const toBN = (n: number): BN => new BN(`${n}`);

const walletIsConnected = (
  wallet: SparseWalletContextAdapter
): wallet is ConnectedWallet => wallet.connected && wallet.publicKey != null;

const safeParsePublicKey = (key: string): PublicKey | null => {
  try {
    return new PublicKey(key);
  } catch (e) {
    return null;
  }
};

const safeParsePublicKeyFromUrl = (): PublicKey | null => {
  const hash = window.location.hash;
  const key = hash.replace("#", "");
  return safeParsePublicKey(key);
};

type UIMode = "STAKE" | "UNSTAKE" | "LOCK" | "TRANSFER";

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

export const lamportsToDisplay = (
  lamports: BN,
  precision: number = 2
): string => toFixedWithPrecision(toSol(lamports), precision);

const toFixedWithPrecision = (
  n: number,
  precision = MAX_NUM_PRECISION
): string => String(Number(n.toFixed(precision)));

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

const DEFAULT_SOLANA_USD_PRICE = 2000; // SOL price in USD cents
const DEFAULT_NCT_USD_PRICE = 200; // NCT price in USD cents

interface Prices {
  solana: number;
  nct: number;
}
const PRICES: Prices = {
  solana: DEFAULT_SOLANA_USD_PRICE,
  nct: DEFAULT_NCT_USD_PRICE,
};

fetch("https://api.sunrisestake.com/prices")
  .then(async (res) => res.json())
  .then(({ solana, "toucan-protocol-nature-carbon-tonne": nct }) => {
    console.log("Prices", { solana, nct });
    PRICES.solana = Number(solana.usd) * 100;
    PRICES.nct = Number(nct.usd) * 100;
  })
  .catch(console.error);

const solToCarbon = (sol: number): number => (sol * PRICES.solana) / PRICES.nct;

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

const handleError = (error: Error): void => {
  notifyTransaction({
    type: NotificationType.error,
    message: "Transaction failed",
    description: error.message,
  });
  console.error(error);
};

const toShortBase58 = (address: PublicKey): string =>
  `${address.toBase58().slice(0, 4)}…${address.toBase58().slice(-4)}`;

export const mostRecent = <T extends { timestamp: Date }>(
  elements: T[]
): T | undefined =>
  elements.reduce<T | undefined>((currentMostRecent, next) => {
    if (currentMostRecent) {
      return currentMostRecent.timestamp.getTime() > next.timestamp.getTime()
        ? currentMostRecent
        : next;
    } else {
      return next;
    }
  }, undefined);

const addUp = <K extends string, T extends { [key in K]: number }>(
  key: K,
  arr: T[]
): number => arr.reduce((acc, val) => acc + val[key], 0);
const round = (number: number, decimals: number = 2): number =>
  parseFloat(number.toFixed(decimals));

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);
const rangeTo = (end: number): number[] => range(0, end);

const settledPromises = <T>(results: Array<PromiseSettledResult<T>>): T[] =>
  results
    .filter(
      (result): result is PromiseFulfilledResult<T> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);

// TODO remove this and maintain a list of balances in state, which get updated by a separate process
const memoise = <T extends (...args: any[]) => any>(
  withKey: (...args: any[]) => string,
  fn: T
): T => {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: any[]) => {
    const key = withKey(...args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

const replaceInArray = <T>(arr: T[], oldItem: T, newItem: T): T[] => {
  const index = arr.indexOf(oldItem);
  if (index === -1) return arr;
  return [...arr.slice(0, index), newItem, ...arr.slice(index + 1)];
};

export {
  addUp,
  round,
  ZERO,
  type UIMode,
  debounce,
  getDigits,
  replaceInArray,
  safeParsePublicKey,
  safeParsePublicKeyFromUrl,
  settledPromises,
  solToCarbon,
  solToLamports,
  toBN,
  toFixedWithPrecision,
  walletIsConnected,
  rangeTo,
  toShortBase58,
  memoise,
  handleError,
  noop,
};
