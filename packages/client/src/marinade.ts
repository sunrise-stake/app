import {
  type PublicKey,
  StakeProgram,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  type Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  findBSolTokenAccountAuthority,
  findEpochReportAccount,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  findOrderUnstakeTicketAccount,
  getValidatorIndex,
  type SunriseStakeConfig,
} from "./util.js";
import {
  type Marinade,
  type MarinadeState,
  MarinadeUtils,
} from "@sunrisestake/marinade-ts-sdk";
import { type Program, utils } from "@coral-xyz/anchor";
import { type BlazeState } from "./types/Solblaze.js";
import { type SunriseStake } from "./types/sunrise_stake.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { STAKE_POOL_PROGRAM_ID } from "./constants.js";
import { type EpochReportAccount } from "./types/EpochReportAccount.js";

// export type EpochReportAccount =
//   IdlAccounts<SunriseStake>["epochReportAccount"];

export const deposit = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  marinade: Marinade,
  marinadeState: MarinadeState,
  stateAddress: PublicKey,
  staker: PublicKey,
  recipientGsolTokenAccount: PublicKey,
  lamports: BN
): Promise<Transaction> => {
  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );

  const liqPoolAssociatedTokenAccountAddress =
    await utils.token.associatedAddress({
      mint: marinadeState.lpMint.address,
      owner: msolTokenAccountAuthority,
    });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.deposit>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: stateAddress,
    marinadeState: marinadeState.marinadeStateAddress,
    gsolMint: sunriseStakeState.gsolMint,
    gsolMintAuthority,
    msolMint: marinadeState.mSolMint.address,
    liqPoolMint: marinadeState.lpMint.address,
    liqPoolSolLegPda: await marinadeState.solLeg(),
    liqPoolMsolLeg: marinadeState.mSolLeg,
    liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
    liqPoolMintAuthority: await marinadeState.lpMintAuthority(),
    reservePda: await marinadeState.reserveAddress(),
    transferFrom: staker,
    mintMsolTo: msolAssociatedTokenAccountAddress,
    mintLiqPoolTo: liqPoolAssociatedTokenAccountAddress,
    mintGsolTo: recipientGsolTokenAccount,
    msolMintAuthority: await marinadeState.mSolMintAuthority(),
    msolTokenAccountAuthority,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    marinadeProgram,
  };

  return program.methods.deposit(lamports).accounts(accounts).transaction();
};

export const depositStakeAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  marinade: Marinade,
  marinadeState: MarinadeState,
  staker: PublicKey,
  stakeAccountAddress: PublicKey,
  stakerGsolTokenAccount: PublicKey
): Promise<Transaction> => {
  const stateAddress = config.stateAddress;

  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );

  type Accounts = Parameters<
    ReturnType<typeof program.methods.depositStakeAccount>["accounts"]
  >[0];

  const stakeAccountInfo = await MarinadeUtils.getParsedStakeAccountInfo(
    marinade.provider,
    stakeAccountAddress
  );
  const voterAddress = stakeAccountInfo.voterAddress;
  if (!voterAddress) {
    throw new Error("The stake account must be delegated");
  }

  const validatorSystem = marinadeState.state.validatorSystem;
  const stakeSystem = marinadeState.state.stakeSystem;
  const accounts: Accounts = {
    state: stateAddress,
    marinadeState: marinadeState.marinadeStateAddress,
    gsolMint: sunriseStakeState.gsolMint,
    gsolMintAuthority,
    validatorList: validatorSystem.validatorList.account,
    stakeList: stakeSystem.stakeList.account,
    stakeAccount: stakeAccountAddress,
    duplicationFlag: await marinadeState.validatorDuplicationFlag(voterAddress),
    stakeAuthority: staker,
    msolMint: marinadeState.mSolMint.address,
    mintMsolTo: msolAssociatedTokenAccountAddress,
    mintGsolTo: stakerGsolTokenAccount,
    msolMintAuthority: await marinadeState.mSolMintAuthority(),
    msolTokenAccountAuthority,
    clock: SYSVAR_CLOCK_PUBKEY,
    rent: SYSVAR_RENT_PUBKEY,
    stakeProgram: StakeProgram.programId,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    marinadeProgram,
  };
  const validatorIndex = await getValidatorIndex(marinadeState, voterAddress);
  return program.methods
    .depositStakeAccount(validatorIndex)
    .accounts(accounts)
    .transaction();
};

export const getEpochReportAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>
): Promise<{
  address: PublicKey;
  bump: number;
  account: EpochReportAccount | null;
}> => {
  const [address, bump] = findEpochReportAccount(config);
  const account = await program.account.epochReportAccount.fetchNullable(
    address
  );

  return {
    address,
    bump,
    account,
  };
};

// TODO move this into the client to avoid having to pass in so many things?
export const liquidUnstake = async (
  config: SunriseStakeConfig,
  blaze: BlazeState,
  marinade: Marinade,
  marinadeState: MarinadeState,
  program: Program<SunriseStake>,
  stateAddress: PublicKey,
  staker: PublicKey,
  stakerGsolTokenAccount: PublicKey,
  lamports: BN
): Promise<Transaction> => {
  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );
  // use the same token authority PDA for the msol token account
  // and the liquidity pool token account for convenience
  const liqPoolAssociatedTokenAccountAddress =
    await utils.token.associatedAddress({
      mint: marinadeState.lpMint.address,
      owner: msolTokenAccountAuthority,
    });

  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = await utils.token.associatedAddress({
    mint: blaze.bsolMint,
    owner: bsolTokenAccountAuthority,
  });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.liquidUnstake>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: stateAddress,
    marinadeState: marinadeState.marinadeStateAddress,
    msolMint: marinadeState.mSolMint.address,
    liqPoolMint: marinadeState.lpMint.address,
    gsolMint: sunriseStakeState.gsolMint,
    gsolMintAuthority,
    liqPoolSolLegPda: await marinadeState.solLeg(),
    liqPoolMsolLeg: marinadeState.mSolLeg,
    liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
    treasuryMsolAccount: marinadeState.treasuryMsolAccount,
    getMsolFrom: msolAssociatedTokenAccountAddress,
    getMsolFromAuthority: msolTokenAccountAuthority,
    getLiqPoolTokenFrom: liqPoolAssociatedTokenAccountAddress,
    gsolTokenAccount: stakerGsolTokenAccount,
    gsolTokenAccountAuthority: staker,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: SYSVAR_RENT_PUBKEY,
    marinadeProgram,
    bsolTokenAccount: bsolAssociatedTokenAddress,
    bsolAccountAuthority: bsolTokenAccountAuthority,
    blazeStakePool: blaze.pool,
    stakePoolWithdrawAuthority: blaze.withdrawAuthority,
    reserveStakeAccount: blaze.reserveAccount,
    managerFeeAccount: blaze.feesDepot,
    bsolMint: blaze.bsolMint,
    sysvarStakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
    stakePoolProgram: STAKE_POOL_PROGRAM_ID,
    nativeStakeProgram: StakeProgram.programId,
    clock: SYSVAR_CLOCK_PUBKEY,
  };

  return program.methods
    .liquidUnstake(lamports)
    .accounts(accounts)
    .transaction();
};

export interface TriggerRebalanceResult {
  instruction: TransactionInstruction;
  orderUnstakeTicketAccount: PublicKey;
  epochReportAccount: PublicKey;
}
export const triggerRebalance = async (
  config: SunriseStakeConfig,
  marinade: Marinade,
  marinadeState: MarinadeState,
  program: Program<SunriseStake>,
  stateAddress: PublicKey,
  payer: PublicKey
): Promise<TriggerRebalanceResult> => {
  const sunriseStakeState = await program.account.state.fetch(stateAddress);
  const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
    {
      mint: marinadeState.mSolMintAddress,
      owner: msolTokenAccountAuthority,
    }
  );
  const liqPoolAssociatedTokenAccountAddress =
    await utils.token.associatedAddress({
      mint: marinadeState.lpMint.address,
      owner: msolTokenAccountAuthority,
    });

  const epochInfo = await program.provider.connection.getEpochInfo();
  const { account: epochReportAccount, address: epochReportAccountAddress } =
    await getEpochReportAccount(config, program);

  // If the epoch report account has not yet been created, then the upgrade_authority has to create it
  // with the initEpochReport instruction
  if (!epochReportAccount) throw new Error("No epoch report account found");

  // If the epoch report account has not yet been incremented to the current epoch,
  // then we may need to recover tickets from the previous epoch first
  // The triggerRebalance instruction should fail in that case

  // TODO add check to see if rebalancing is needed

  // TODO incrementing on the client side like this will cause clashes in future, we need to replace it
  const index = epochReportAccount.tickets.toNumber() ?? 0;
  const [orderUnstakeTicketAccount, orderUnstakeTicketAccountBump] =
    findOrderUnstakeTicketAccount(
      config,
      BigInt(epochInfo.epoch),
      BigInt(index)
    );

  type Accounts = Parameters<
    ReturnType<typeof program.methods.triggerPoolRebalance>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: stateAddress,
    payer,
    marinadeState: marinadeState.marinadeStateAddress,
    gsolMint: sunriseStakeState.gsolMint,
    msolMint: marinadeState.mSolMint.address,
    liqPoolMint: marinadeState.lpMint.address,
    liqPoolSolLegPda: await marinadeState.solLeg(),
    liqPoolMsolLeg: marinadeState.mSolLeg,
    liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
    liqPoolMintAuthority: await marinadeState.lpMintAuthority(),
    liqPoolTokenAccount: liqPoolAssociatedTokenAccountAddress,
    reservePda: await marinadeState.reserveAddress(),
    treasuryMsolAccount: marinadeState.treasuryMsolAccount,
    getMsolFrom: msolAssociatedTokenAccountAddress,
    getMsolFromAuthority: msolTokenAccountAuthority,
    orderUnstakeTicketAccount,
    epochReportAccount: epochReportAccountAddress,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: SYSVAR_CLOCK_PUBKEY,
    rent: SYSVAR_RENT_PUBKEY,
    marinadeProgram,
  };

  const instruction = await program.methods
    .triggerPoolRebalance(
      new BN(epochInfo.epoch),
      new BN(index),
      orderUnstakeTicketAccountBump
    )
    .accounts(accounts)
    .instruction();

  return {
    instruction,
    orderUnstakeTicketAccount,
    epochReportAccount: epochReportAccountAddress,
  };
};
