import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SunriseStakeConfig } from "./util";
import { Marinade, MarinadeState } from "@sunrisestake/marinade-ts-sdk";
import { Program } from "@project-serum/anchor";
import { SunriseStake } from "./types/SunriseStake";
import BN from "bn.js";
import { ManagementAccount } from "./types/ManagementAccount";
export declare const deposit: (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  marinade: Marinade,
  marinadeState: MarinadeState,
  stateAddress: PublicKey,
  staker: PublicKey,
  stakerGsolTokenAccount: PublicKey,
  lamports: BN
) => Promise<Transaction>;
export declare const depositStakeAccount: (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  marinade: Marinade,
  marinadeState: MarinadeState,
  staker: PublicKey,
  stakeAccountAddress: PublicKey,
  stakerGsolTokenAccount: PublicKey
) => Promise<Transaction>;
export declare const liquidUnstake: (
  config: SunriseStakeConfig,
  marinade: Marinade,
  marinadeState: MarinadeState,
  program: Program<SunriseStake>,
  stateAddress: PublicKey,
  staker: PublicKey,
  stakerGsolTokenAccount: PublicKey,
  lamports: BN
) => Promise<Transaction>;
export declare const orders: (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  epoch: bigint
) => Promise<{
  managementAccount: {
    address: PublicKey;
    bump: number;
    account: ManagementAccount | null;
  };
  tickets: PublicKey[];
}>;
export interface TriggerRebalanceResult {
  instruction: TransactionInstruction;
  orderUnstakeTicketAccount: PublicKey;
  managementAccount: PublicKey;
  previousManagementAccount: PublicKey;
}
export declare const triggerRebalance: (
  config: SunriseStakeConfig,
  marinade: Marinade,
  marinadeState: MarinadeState,
  program: Program<SunriseStake>,
  stateAddress: PublicKey,
  payer: PublicKey
) => Promise<TriggerRebalanceResult>;
