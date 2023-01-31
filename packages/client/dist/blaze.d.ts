import { Transaction } from "@solana/web3.js";
import { SunriseStakeConfig } from "./util";
import { BlazeState } from "./types/Solblaze";
export declare const blazeDeposit: (
  config: SunriseStakeConfig,
  program: any,
  blaze: BlazeState,
  depositor: any,
  depositorGsolTokenAccount: any,
  lamports: any
) => Promise<Transaction>;
export declare const blazeDepositStake: (
  config: SunriseStakeConfig,
  program: any,
  provider: any,
  blaze: BlazeState,
  depositor: any,
  stakeAccount: any,
  depositorGsolTokenAccount: any
) => Promise<Transaction>;
export declare const blazeWithdrawSol: (
  config: SunriseStakeConfig,
  program: any,
  blaze: BlazeState,
  user: any,
  userGsolTokenAccount: any,
  amount: any
) => Promise<Transaction>;
export declare const blazeWithdrawStake: (
  config: SunriseStakeConfig,
  program: any,
  blaze: BlazeState,
  newStakeAccount: any,
  user: any,
  userGsolTokenAccount: any,
  amount: any
) => Promise<Transaction>;
