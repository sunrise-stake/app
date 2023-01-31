import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SunriseStakeConfig } from "./util";
import { ManagementAccount } from "./types/ManagementAccount";
export declare const deposit: (
  config: SunriseStakeConfig,
  program: any,
  marinade: any,
  marinadeState: any,
  stateAddress: any,
  staker: any,
  stakerGsolTokenAccount: any,
  lamports: any
) => Promise<Transaction>;
export declare const depositStakeAccount: (
  config: SunriseStakeConfig,
  program: any,
  marinade: any,
  marinadeState: any,
  staker: any,
  stakeAccountAddress: any,
  stakerGsolTokenAccount: any
) => Promise<Transaction>;
export declare const liquidUnstake: (
  config: SunriseStakeConfig,
  marinade: any,
  marinadeState: any,
  program: any,
  stateAddress: any,
  staker: any,
  stakerGsolTokenAccount: any,
  lamports: any
) => Promise<Transaction>;
export declare const orders: (
  config: SunriseStakeConfig,
  program: any,
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
  marinade: any,
  marinadeState: any,
  program: any,
  stateAddress: any,
  payer: any
) => Promise<TriggerRebalanceResult>;
