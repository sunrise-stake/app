import type BN from "bn.js";
import {
  type EpochInfo,
  type PublicKey,
  type TokenAmount,
} from "@solana/web3.js";
import { type EpochReportAccount } from "./EpochReportAccount";
import { type Level } from "@sunrisestake/impact-nft-client";

export interface Balance {
  gsolBalance: TokenAmount;
  gsolSupply: TokenAmount;
  msolBalance: TokenAmount;
  msolPrice: number;
  liqPoolBalance: TokenAmount;
  treasuryBalance: number;
  bsolBalance: TokenAmount;
  holdingAccountBalance: number;
}

export interface Details {
  // TODO Standardise on number/bigint/BigDecimal
  staker: string;
  currentEpoch: EpochInfo;
  epochReport: EpochReportAccount;
  balances: Balance;
  stakerGSolTokenAccount: string;
  sunriseStakeConfig: {
    gsolMint: string;
    programId: string;
    stateAddress: string;
    treasury: string;
    msolTokenAccount?: string;
    msolTokenAccountAuthority?: string;
  };
  marinadeFinanceProgramId: string;
  marinadeStateAddress: string;
  extractableYield: BN;

  mpDetails: {
    msolPrice: number;
    stakeDelta: number;
    msolValue: BN;
  };
  lpDetails: {
    mintAddress: string;
    supply: bigint;
    mintAuthority?: string;
    decimals: number;
    lpSolShare: BN; // The amount of lamports in the pool owned by sunrise
    lpMsolShare: BN; // The amount of msol in the pool owned by sunrise
    lpSolValue: BN; // The sum of the lpSolBalance and the sol value of lpMsolBalance - the total value of the pool owned by sunrise
    msolLeg: string;
  };
  bpDetails: {
    pool: string;
    bsolPrice: number;
    bsolValue: BN;
    solWithdrawalFee: {
      numerator: BN;
      denominator: BN;
    };
  };
  lockDetails?: {
    amountLocked: BN;
    startEpoch: BN;
    updatedToEpoch: BN;
    yield: BN;
    lockAccount: PublicKey;
    lockTokenAccount: PublicKey;
    currentLevel: Level | null;
    yieldToNextLevel: BN | null;
  };
  impactNFTDetails?: {
    stateAddress: PublicKey;
    mintAuthority: PublicKey;
    mint: PublicKey;
    tokenAccount: PublicKey;
  };
}

export interface WithdrawalFees {
  liquidUnstakeFee: BN;
  ticketFee: number;
  totalFee: BN;
}
