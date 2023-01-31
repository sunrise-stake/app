import { PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { SunriseStakeConfig } from "./util";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { SunriseStake } from "./types/SunriseStake";
import { BlazeState } from "./types/Solblaze";
export declare const blazeDeposit: (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  blaze: BlazeState,
  depositor: PublicKey,
  depositorGsolTokenAccount: PublicKey,
  lamports: BN
) => Promise<Transaction>;
export declare const blazeDepositStake: (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  provider: AnchorProvider,
  blaze: BlazeState,
  depositor: PublicKey,
  stakeAccount: PublicKey,
  depositorGsolTokenAccount: PublicKey
) => Promise<Transaction>;
export declare const blazeWithdrawSol: (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  blaze: BlazeState,
  user: PublicKey,
  userGsolTokenAccount: PublicKey,
  amount: BN
) => Promise<Transaction>;
export declare const blazeWithdrawStake: (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  blaze: BlazeState,
  newStakeAccount: PublicKey,
  user: PublicKey,
  userGsolTokenAccount: PublicKey,
  amount: BN
) => Promise<Transaction>;
