import BN from "bn.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const depositLamports = new BN(100 * LAMPORTS_PER_SOL); // Deposit 100 SOL
export const unstakeLamportsUnderLPBalance = new BN(LAMPORTS_PER_SOL); // 1 SOL
export const unstakeLamportsExceedLPBalance = new BN(20 * LAMPORTS_PER_SOL); // 20 SOL
export const orderUnstakeLamports = new BN(2 * LAMPORTS_PER_SOL); // Order a delayed unstake of 2 SOL
export const burnLamports = 100 * LAMPORTS_PER_SOL;

export const lockLamports = new BN(LAMPORTS_PER_SOL); // Lock 1 SOL

export const blazeDepositLamports = new BN(100 * LAMPORTS_PER_SOL);
export const blazeUnstakeLamports = new BN(60 * LAMPORTS_PER_SOL);
export const marinadeStakeDeposit = new BN(100 * LAMPORTS_PER_SOL);
