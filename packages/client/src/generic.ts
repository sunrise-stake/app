import {
  PublicKey,
  SystemProgram,
  AddressLookupTableProgram,
  type Transaction,
  type TransactionInstruction,
  type Connection,
  type AccountMeta,
} from "@solana/web3.js";
import BN from "bn.js";
import { getStakePoolAccount } from "./decode_pool";
import {
  findBSolTokenAccountAuthority,
  findGSolMintAuthority,
  findManagerAccount,
  findGenericTokenAccountAuthority,
  findLookupTableAccount,
  findMSolTokenAccountAuthority,
  findSplPoolDepositAuthority,
  findSplPoolWithdrawAuthority,
  type SunriseStakeConfig,
  findAssociatedTokenAddress,
} from "./util";
import { STAKE_POOL_PROGRAM_ID } from "./constants";
import { type Program, utils } from "@project-serum/anchor";
import { type SunriseStake } from "./types/sunrise_stake";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  type Marinade,
  type MarinadeState,
} from "@sunrisestake/marinade-ts-sdk";

export const initializeV2Accounts = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  payer: PublicKey
): Promise<Transaction> => {
  const bsolAuthority = findBSolTokenAccountAuthority(config)[0];
  const [managerAccount] = findManagerAccount(config);

  return program.methods
    .initializeV2()
    .accounts({
      state: config.stateAddress,
      updateAuthority: config.updateAuthority,
      payer,
      manager: managerAccount,
      splTokenAccountAuthority: bsolAuthority,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

const createTable = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  payer: PublicKey,
  slot: number
): Promise<Transaction> => {
  const [managerAccount] = findManagerAccount(config);
  const [lookupAccount] = await findLookupTableAccount(managerAccount, slot);

  return program.methods
    .createLookupTable(new BN(slot))
    .accounts({
      state: config.stateAddress,
      updateAuthority: config.updateAuthority,
      payer,
      lookupTableAccount: lookupAccount,
      manager: managerAccount,
      systemProgram: SystemProgram.programId,
      lookupTableProgram: AddressLookupTableProgram.programId,
    })
    .transaction();
};

export const createSplLookup = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  payer: PublicKey,
  slot: number
): Promise<Transaction> => {
  return createTable(config, program, payer, slot);
};

export const createMarinadeLookup = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  payer: PublicKey,
  slot: number
): Promise<Transaction> => {
  return createTable(config, program, payer, slot);
};

const ExtendLookupTable = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  lookupTable: PublicKey,
  addresses: PublicKey[],
  payer: PublicKey
): Promise<TransactionInstruction> => {
  const [managerAccount] = findManagerAccount(config);

  return program.methods
    .extendTable(addresses)
    .accounts({
      state: config.stateAddress,
      lookupTable,
      manager: managerAccount,
      updateAuthority: config.updateAuthority,
      payer,
      systemProgram: SystemProgram.programId,
      lookupTableProgram: AddressLookupTableProgram.programId,
    })
    .instruction();
};

export const ExtendMarinadeLookup = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  addresses: PublicKey[],
  payer: PublicKey
): Promise<TransactionInstruction> => {
  const [managerAccount] = findManagerAccount(config);
  const managerInfo = await program.account.manager.fetch(managerAccount);
  return ExtendLookupTable(
    config,
    program,
    managerInfo.marinadeLookupTable,
    addresses,
    payer
  );
};

export const ExtendSplLookup = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  addresses: PublicKey[],
  payer: PublicKey
): Promise<TransactionInstruction> => {
  const [managerAccount] = findManagerAccount(config);
  const managerInfo = await program.account.manager.fetch(managerAccount);
  return ExtendLookupTable(
    config,
    program,
    managerInfo.splLookupTable,
    addresses,
    payer
  );
};

export const RegisterPool = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  stakePoolAccount: PublicKey,
  payer: PublicKey
): Promise<Transaction> => {
  const stakePool = await getStakePoolAccount(
    program.provider.connection,
    stakePoolAccount
  );
  const [tokenAccountAuth] = findGenericTokenAccountAuthority(config);
  const [withdrawAuthority] = findSplPoolWithdrawAuthority(stakePoolAccount);
  const [depositAuthority] = findSplPoolDepositAuthority(stakePoolAccount);

  const poolMintTokenAccount = await utils.token.associatedAddress({
    mint: stakePool.poolMint,
    owner: tokenAccountAuth,
  });

  const [managerAccount] = findManagerAccount(config);
  const managerInfo = await program.account.manager.fetch(managerAccount);

  const addresses = await getSplAddresses(
    config,
    program.provider.connection,
    stakePoolAccount
  );
  const extendIx = await ExtendSplLookup(config, program, addresses, payer);

  return program.methods
    .registerPool()
    .accounts({
      state: config.stateAddress,
      updateAuthority: config.updateAuthority,
      payer,
      stakePool: stakePoolAccount,
      stakePoolMint: stakePool.poolMint,
      poolWithdrawAuthority: withdrawAuthority,
      poolDepositAuthority: depositAuthority,
      genericTokenAccountAuth: tokenAccountAuth,
      sunrisePoolTokenAccount: poolMintTokenAccount,
      lookupTable: managerInfo.splLookupTable,
      manager: managerAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      lookupTableProgram: AddressLookupTableProgram.programId,
    })
    .postInstructions([extendIx])
    .transaction();
};

export const splitDeposit = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  staker: PublicKey,
  stakerGSolTokenAccount: PublicKey,
  lamports: BN,
  marinade: Marinade,
  marinadeState: MarinadeState
): Promise<TransactionInstruction> => {
  const gsolMintAuthority = findGSolMintAuthority(config)[0];
  const managerAccount = findManagerAccount(config)[0];
  const info = await program.account.manager.fetch(managerAccount);
  const pool = info.splPools[0];

  const splAccounts = await constructSplAccountsForDeposit(
    config,
    program.provider.connection,
    pool
  );
  const marinadeAccounts = await constructMarinadeAccountsForDeposit(
    config,
    marinadeState
  );
  const remainingAccounts = marinadeAccounts.concat(splAccounts);

  const marinadeOffset = 0;
  const splOffset = marinadeOffset + marinadeAccounts.length;
  const poolCount = 1;

  return program.methods
    .splitDeposit(lamports, marinadeOffset, splOffset, poolCount)
    .accounts({
      state: config.stateAddress,
      gsolMint: config.gsolMint,
      gsolMintAuthority,
      transferFrom: staker,
      manager: managerAccount,
      genericTokenAccountAuth: findGenericTokenAccountAuthority(config)[0],
      mintGsolTo: stakerGSolTokenAccount,
      stakePoolProgram: STAKE_POOL_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      marinadeProgram: marinade.marinadeFinanceProgram.programAddress,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
};

export const getSplAddresses = async (
  config: SunriseStakeConfig,
  connection: Connection,
  stakePool: PublicKey
): Promise<PublicKey[]> => {
  const info = await getStakePoolAccount(connection, stakePool);

  const tokenAccountAuth = findGenericTokenAccountAuthority(config)[0];
  const poolMintTokenAccount = await findAssociatedTokenAddress(
    info.poolMint,
    tokenAccountAuth
  );

  const [withdrawAuthority] = PublicKey.findProgramAddressSync(
    [stakePool.toBuffer(), Buffer.from("withdraw")],
    STAKE_POOL_PROGRAM_ID
  );

  const [depositAuthority] = PublicKey.findProgramAddressSync(
    [stakePool.toBuffer(), Buffer.from("deposit")],
    STAKE_POOL_PROGRAM_ID
  );

  // TODO: Make named?
  return [
    stakePool,
    info.poolMint,
    info.managerFeeAccount,
    info.reserveStake,
    info.validatorList,
    depositAuthority,
    withdrawAuthority,
    poolMintTokenAccount,
    tokenAccountAuth,
    info.stakeDepositAuthority,
  ];
};

const getMarinadeAddresses = async (
  config: SunriseStakeConfig,
  marinadeState: MarinadeState
): Promise<PublicKey[]> => {
  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];

  const sunriseMsolTokenAccount = await utils.token.associatedAddress({
    mint: marinadeState.mSolMintAddress,
    owner: msolTokenAccountAuthority,
  });
  const sunriseLiqPoolTokenAccount = await utils.token.associatedAddress({
    mint: marinadeState.lpMint.address,
    owner: msolTokenAccountAuthority,
  });

  // TODO: Make named?
  return [
    marinadeState.marinadeStateAddress,
    marinadeState.mSolMint.address,
    marinadeState.lpMint.address,
    await marinadeState.solLeg(),
    marinadeState.mSolLeg,
    await marinadeState.mSolLegAuthority(),
    await marinadeState.lpMintAuthority(),
    marinadeState.treasuryMsolAccount,
    await marinadeState.reserveAddress(),
    await marinadeState.mSolMintAuthority(),
    sunriseMsolTokenAccount,
    sunriseLiqPoolTokenAccount,
    msolTokenAccountAuthority,
  ];
};

const constructSplAccountsForDeposit = async (
  config: SunriseStakeConfig,
  connection: Connection,
  stakePool: PublicKey
): Promise<AccountMeta[]> => {
  const keys = await getSplAddresses(config, connection, stakePool);

  const accounts: AccountMeta[] = [
    { pubkey: keys[0], isSigner: false, isWritable: true }, // pool
    { pubkey: keys[1], isSigner: false, isWritable: true }, // poolMint
    { pubkey: keys[2], isSigner: false, isWritable: true }, // managerFeeAccount
    { pubkey: keys[3], isSigner: false, isWritable: true }, // reserveStakeAccount
    { pubkey: keys[4], isSigner: false, isWritable: false }, // validatorList
    { pubkey: keys[5], isSigner: false, isWritable: false }, // poolDepositAuthority
    { pubkey: keys[6], isSigner: false, isWritable: false }, // poolWithdrawAuthority
    { pubkey: keys[7], isSigner: false, isWritable: true }, // sunrisePoolMintTokenAccount
    { pubkey: keys[8], isSigner: false, isWritable: false }, // tokenAccountAuthority
  ];
  return accounts;
};

const constructMarinadeAccountsForDeposit = async (
  config: SunriseStakeConfig,
  marinadeState: MarinadeState
): Promise<AccountMeta[]> => {
  const keys = await getMarinadeAddresses(config, marinadeState);

  const accounts: AccountMeta[] = [
    { pubkey: keys[0], isSigner: false, isWritable: true }, // marinadeState
    { pubkey: keys[1], isSigner: false, isWritable: true }, // msolMint
    { pubkey: keys[2], isSigner: false, isWritable: true }, // lpMint
    { pubkey: keys[3], isSigner: false, isWritable: true }, // solLeg
    { pubkey: keys[4], isSigner: false, isWritable: true }, // mSolLeg
    { pubkey: keys[5], isSigner: false, isWritable: false }, // msolLegAuthority
    { pubkey: keys[6], isSigner: false, isWritable: false }, // lpMintAuthority
    { pubkey: keys[7], isSigner: false, isWritable: false }, // treasuryMsolAccount
    { pubkey: keys[8], isSigner: false, isWritable: true }, // reserveAddress
    { pubkey: keys[9], isSigner: false, isWritable: false }, // mSolMintAuthority
    { pubkey: keys[10], isSigner: false, isWritable: true }, // sunriseMsolTokenAccount
    { pubkey: keys[11], isSigner: false, isWritable: true }, // sunriseLiqPoolTokenAccount
    { pubkey: keys[12], isSigner: false, isWritable: false }, // msolTokenAccountAuthority
  ];

  return accounts;
};
