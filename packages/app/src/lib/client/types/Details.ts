import BN from "bn.js";
import { Balance } from "../util";
import { EpochInfo } from "@solana/web3.js";

export interface InflightDetails {
  epoch: bigint;
  tickets: number;
  totalOrderedLamports: BN;
}

export interface Details {
  // TODO Standardise on number/bigint/BigDecimal
  staker: string;
  epochInfo: EpochInfo;
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
    lpSolShare: BN;
    lpSolValue: BN;
    msolLeg: string;
  };
  bpDetails: {
    pool: string;
    bsolPrice: number;
    bsolValue: BN;
  };
  inflight: InflightDetails[];
}
