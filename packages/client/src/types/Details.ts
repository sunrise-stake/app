import type BN from "bn.js";
import { type Balance } from "../util";
import { type EpochInfo, type PublicKey } from "@solana/web3.js";
import { type EpochReportAccount } from "./EpochReportAccount";

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
  };
  managerDetails?: {
    manager: PublicKey;
    splLookup: PublicKey;
    marinadeLookup: PublicKey;
    genericAuth: PublicKey;
    marinadeWidth: number;
    splWidth: number;
    splCount: number;
    splPools: PublicKey[];
  }
}

export interface WithdrawalFees {
  liquidUnstakeFee: BN;
  ticketFee: number;
  totalFee: BN;
}
