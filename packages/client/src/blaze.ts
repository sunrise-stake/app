import {
  PublicKey,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  type Transaction,
  type Connection,
} from "@solana/web3.js";
import BN from "bn.js";
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
import { getStakePoolAccount } from "./decodeStakePool.js";
import {
  ValidatorListLayout,
  ValidatorStakeInfoLayout,
} from "@solana/spl-stake-pool";

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
  if (validatorAccount == null) {
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

/**
 * Size of each ValidatorStakeInfo entry in bytes.
 * From @solana/spl-stake-pool ValidatorStakeInfoLayout.span
 */
const VALIDATOR_STAKE_INFO_SIZE = ValidatorStakeInfoLayout.span;

/** Validator list header size: u8 accountType + u32 maxValidators */
const VALIDATOR_LIST_HEADER_SIZE = 5;

/**
 * Type for decoded validator stake info from @solana/spl-stake-pool.
 */
type ValidatorStakeInfo = ReturnType<typeof ValidatorStakeInfoLayout.decode>;

/**
 * Decode the validator list from account data.
 *
 * Note: SPL stake pool uses a packed array format where validators are stored
 * directly after the header without a length prefix. The number of validators
 * is calculated from the remaining data size divided by entry size.
 *
 * We don't use ValidatorListLayout.decode() because it expects a borsh vec
 * with length prefix, which doesn't match the actual on-chain format.
 */
const decodeValidatorList = (
  data: Buffer
): { accountType: number; maxValidators: number; validators: ValidatorStakeInfo[] } => {
  const accountType = data.readUInt8(0);
  const maxValidators = data.readUInt32LE(1);

  // Calculate number of validators from remaining data (packed array, no length prefix)
  const validatorsData = data.slice(VALIDATOR_LIST_HEADER_SIZE);
  const numValidators = Math.floor(validatorsData.length / VALIDATOR_STAKE_INFO_SIZE);

  const validators: ValidatorStakeInfo[] = [];
  for (let i = 0; i < numValidators; i++) {
    const offset = i * VALIDATOR_STAKE_INFO_SIZE;
    const entryData = validatorsData.slice(offset, offset + VALIDATOR_STAKE_INFO_SIZE);
    if (entryData.length === VALIDATOR_STAKE_INFO_SIZE) {
      validators.push(ValidatorStakeInfoLayout.decode(entryData));
    }
  }

  return { accountType, maxValidators, validators };
};

// Helper function to find the appropriate validator stake account for withdrawal
export const getWithdrawStakeAccount = async (
  connection: Connection,
  blaze: BlazeState
): Promise<PublicKey> => {
  // First, check if there's a preferred withdraw validator
  const stakePool = await getStakePoolAccount(connection, blaze.pool);

  if (stakePool.preferredWithdrawValidatorVoteAddress != null) {
    // Find the validator stake account for the preferred validator
    const validatorListAccount = await connection.getAccountInfo(
      blaze.validatorList
    );
    if (validatorListAccount == null) {
      throw new Error("Validator list account not found");
    }

    const validatorList = decodeValidatorList(validatorListAccount.data);

    // Find the preferred validator's entry
    for (const validator of validatorList.validators) {
      if (
        validator.voteAccountAddress.equals(
          stakePool.preferredWithdrawValidatorVoteAddress
        )
      ) {
        // Calculate validator stake account address
        // Note: seed order is important - it should be: "stake", pool, vote_account
        const [validatorStakeAccount] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("stake"),
            blaze.pool.toBuffer(),
            validator.voteAccountAddress.toBuffer(),
          ],
          STAKE_POOL_PROGRAM_ID
        );
        // Verify the account exists and is a stake account
        const accountInfo = await connection.getAccountInfo(
          validatorStakeAccount
        );
        if (!accountInfo?.owner.equals(StakeProgram.programId)) {
          continue;
        }

        return validatorStakeAccount;
      }
    }
  }

  // If no preferred validator or it wasn't found, find any validator with sufficient balance
  const validatorListAccount = await connection.getAccountInfo(
    blaze.validatorList
  );
  if (validatorListAccount == null) {
    throw new Error("Validator list account not found");
  }

  const validatorList = decodeValidatorList(validatorListAccount.data);

  // Find the first active validator with balance
  for (const validator of validatorList.validators) {
    // Check if validator has active stake (status doesn't seem to be a simple 1 for active)
    // Let's check for non-zero activeStakeLamports instead
    const activeStakeAmount = validator.activeStakeLamports;

    // Check if validator has sufficient balance (more than minimum delegation)
    const minimumDelegation = new BN(1_000_000); // 0.001 SOL as minimum
    if (activeStakeAmount.gt(minimumDelegation)) {
      // Calculate validator stake account address
      // Note: seed order is important - it should be: "stake", pool, vote_account
      const [validatorStakeAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("stake"),
          blaze.pool.toBuffer(),
          validator.voteAccountAddress.toBuffer(),
        ],
        STAKE_POOL_PROGRAM_ID
      );
      // Verify the account exists and is a stake account
      const accountInfo = await connection.getAccountInfo(
        validatorStakeAccount
      );
      if (!accountInfo?.owner.equals(StakeProgram.programId)) {
        continue;
      }

      return validatorStakeAccount;
    }
  }

  // If no suitable validator found, throw error
  // Note: SPL stake pool's withdraw_stake only works with validator stake accounts, not reserve accounts
  throw new Error(
    "No suitable validator stake account found for withdrawal. The stake pool may not have active validators yet."
  );
};

export const blazeWithdrawStake = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  blaze: BlazeState,
  newStakeAccount: PublicKey,
  user: PublicKey,
  userGsolTokenAccount: PublicKey,
  amount: BN,
  connection: Connection
): Promise<Transaction> => {
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = utils.token.associatedAddress({
    mint: blaze.bsolMint,
    owner: bsolTokenAccountAuthority,
  });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.splWithdrawStake>["accounts"]
  >[0];

  // Find the appropriate validator stake account for withdrawal
  const stakeAccountToSplit = await getWithdrawStakeAccount(connection, blaze);

  const accounts: Accounts = {
    state: config.stateAddress,
    user,
    userGsolTokenAccount,
    userNewStakeAccount: newStakeAccount,
    bsolTokenAccount: bsolAssociatedTokenAddress,
    stakePool: blaze.pool,
    validatorStakeList: blaze.validatorList,
    stakePoolWithdrawAuthority: blaze.withdrawAuthority,
    stakeAccountToSplit,
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
