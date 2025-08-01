import {
  type PublicKey,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  type Transaction,
} from "@solana/web3.js";
import type BN from "bn.js";
import {
  findBSolTokenAccountAuthority,
  type SunriseStakeConfig,
} from "./util.js";
import { STAKE_POOL_PROGRAM_ID } from "./constants.js";
import { type AnchorProvider, type Program, utils } from "@coral-xyz/anchor";
import { type SunriseStake } from "./types/sunrise_stake.js";
import { type BlazeState } from "./types/Solblaze.js";
import {
  MarinadeUtils,
  Provider,
  type Wallet,
} from "@sunrisestake/marinade-ts-sdk";

export const blazeDeposit = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  blaze: BlazeState,
  depositor: PublicKey,
  depositorGsolTokenAccount: PublicKey,
  lamports: BN
): Promise<Transaction> => {
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = utils.token.associatedAddress({
    mint: blaze.bsolMint,
    owner: bsolTokenAccountAuthority,
  });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.splDepositSol>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: config.stateAddress,
    depositor,
    depositorGsolTokenAccount,
    bsolTokenAccount: bsolAssociatedTokenAddress,
    stakePool: blaze.pool,
    stakePoolWithdrawAuthority: blaze.withdrawAuthority,
    reserveStakeAccount: blaze.reserveAccount,
    managerFeeAccount: blaze.feesDepot,
    stakePoolTokenMint: blaze.bsolMint,
    stakePoolProgram: STAKE_POOL_PROGRAM_ID,
  };

  return program.methods
    .splDepositSol(lamports)
    .accounts(accounts)
    .transaction();
};

export const blazeDepositStake = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  provider: AnchorProvider,
  blaze: BlazeState,
  depositor: PublicKey,
  stakeAccount: PublicKey,
  depositorGsolTokenAccount: PublicKey
): Promise<Transaction> => {
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = utils.token.associatedAddress({
    mint: blaze.bsolMint,
    owner: bsolTokenAccountAuthority,
  });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.splDepositStake>["accounts"]
  >[0];

  const newProvider = new Provider(
    provider.connection,
    provider.wallet as Wallet,
    {}
  );
  const stakeAccountInfo = await MarinadeUtils.getParsedStakeAccountInfo(
    newProvider,
    stakeAccount
  );
  const validatorAccount = stakeAccountInfo.voterAddress;
  if (!validatorAccount) {
    throw new Error(`Invalid validator account`);
  }

  const accounts: Accounts = {
    state: config.stateAddress,
    stakeAccountDepositor: depositor,
    stakeAccount,
    depositorGsolTokenAccount,
    bsolTokenAccount: bsolAssociatedTokenAddress,
    stakePool: blaze.pool,
    validatorList: blaze.validatorList,
    stakePoolDepositAuthority: blaze.depositAuthority,
    stakePoolWithdrawAuthority: blaze.withdrawAuthority,
    validatorStakeAccount: validatorAccount,
    reserveStakeAccount: blaze.reserveAccount,
    managerFeeAccount: blaze.feesDepot,
    stakePoolTokenMint: blaze.bsolMint,
    sysvarStakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
    sysvarClock: SYSVAR_CLOCK_PUBKEY,
    nativeStakeProgram: StakeProgram.programId,
    stakePoolProgram: STAKE_POOL_PROGRAM_ID,
  };

  return program.methods.splDepositStake().accounts(accounts).transaction();
};

export const blazeWithdrawSol = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  blaze: BlazeState,
  user: PublicKey,
  userGsolTokenAccount: PublicKey,
  amount: BN
): Promise<Transaction> => {
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = utils.token.associatedAddress({
    mint: blaze.bsolMint,
    owner: bsolTokenAccountAuthority,
  });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.splWithdrawSol>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: config.stateAddress,
    user,
    userGsolTokenAccount,
    bsolTokenAccount: bsolAssociatedTokenAddress,
    stakePool: blaze.pool,
    stakePoolWithdrawAuthority: blaze.withdrawAuthority,
    reserveStakeAccount: blaze.reserveAccount,
    managerFeeAccount: blaze.feesDepot,
    stakePoolTokenMint: blaze.bsolMint,
    sysvarStakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
    sysvarClock: SYSVAR_CLOCK_PUBKEY,
    nativeStakeProgram: StakeProgram.programId,
    stakePoolProgram: STAKE_POOL_PROGRAM_ID,
  };

  return program.methods
    .splWithdrawSol(amount)
    .accounts(accounts)
    .transaction();
};

export const blazeWithdrawStake = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  blaze: BlazeState,
  newStakeAccount: PublicKey,
  user: PublicKey,
  userGsolTokenAccount: PublicKey,
  amount: BN
): Promise<Transaction> => {
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = utils.token.associatedAddress({
    mint: blaze.bsolMint,
    owner: bsolTokenAccountAuthority,
  });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.splWithdrawStake>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: config.stateAddress,
    user,
    userGsolTokenAccount,
    userNewStakeAccount: newStakeAccount,
    bsolTokenAccount: bsolAssociatedTokenAddress,
    stakePool: blaze.pool,
    validatorStakeList: blaze.validatorList,
    stakePoolWithdrawAuthority: blaze.withdrawAuthority,
    stakeAccountToSplit: blaze.reserveAccount,
    managerFeeAccount: blaze.feesDepot,
    stakePoolTokenMint: blaze.bsolMint,
    sysvarClock: SYSVAR_CLOCK_PUBKEY,
    nativeStakeProgram: StakeProgram.programId,
    stakePoolProgram: STAKE_POOL_PROGRAM_ID,
  };

  return program.methods
    .splWithdrawStake(amount)
    .accounts(accounts)
    .transaction();
};
