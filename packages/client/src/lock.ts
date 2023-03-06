import {
  findEpochReportAccount,
  findImpactNFTMint,
  findImpactNFTMintAuthority,
  findLockAccount,
  findLockTokenAccount,
  getTokenAccountNullable,
  type SunriseStakeConfig,
} from "./util";
import {
  type PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  type Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import { type LockAccount } from "./types/LockAccount";
import * as anchor from "@coral-xyz/anchor";
import { type AnchorProvider, type Program } from "@coral-xyz/anchor";
import { type SunriseStake } from "./types/sunrise_stake";
import {
  type Account as TokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type BN from "bn.js";
import { ImpactNftClient } from "@sunrisestake/impact-nft-client";
import { type EnvironmentConfig } from "./constants";

interface GetLockTokenAccountResult {
  address: PublicKey;
  account: TokenAccount | null; // null if not yet created
}
const getLockTokenAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey
): Promise<GetLockTokenAccountResult> => {
  const [address] = findLockTokenAccount(config, authority);

  const account = await getTokenAccountNullable(
    program.provider.connection,
    address
  );

  return { address, account };
};

export interface GetLockAccountResult {
  lockAccountAddress: PublicKey;
  tokenAccountAddress: PublicKey;
  lockAccount: LockAccount | null; // null if not yet created
  tokenAccount: TokenAccount | null; // null if not yet created
}
export const getLockAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey
): Promise<GetLockAccountResult> => {
  const [lockAccountAddress] = findLockAccount(config, authority);

  const getLockTokenAccountPromise = getLockTokenAccount(
    config,
    program,
    authority
  );
  const fetchLockAccountPromise =
    program.account.lockAccount.fetchNullable(lockAccountAddress);

  const [
    { account: tokenAccount, address: tokenAccountAddress }, // getLockTokenAccountPromise
    account, // fetchLockAccountPromise
  ] = await Promise.all([getLockTokenAccountPromise, fetchLockAccountPromise]);

  if (!account)
    return {
      lockAccountAddress,
      tokenAccountAddress,
      lockAccount: null,
      tokenAccount: null,
    };

  const lockAccount = {
    address: lockAccountAddress,
    authority,
    lockTokenAccount: account.tokenAccount,
    startEpoch: account.startEpoch,
    updatedToEpoch: account.updatedToEpoch,
    stateAddress: account.stateAddress,
    sunriseYieldAtStart: account.sunriseYieldAtStart,
    yieldAccruedByOwner: account.yieldAccruedByOwner,
  };

  return { lockAccountAddress, tokenAccountAddress, lockAccount, tokenAccount };
};

interface ImpactNFTAccounts {
  impactNftProgram: PublicKey;
  tokenMetadataProgram: PublicKey;
  impactNftState: PublicKey;
  nftMint: PublicKey;
  nftMintAuthority: PublicKey;
  nftMetadata: PublicKey;
  nftHolderTokenAccount: PublicKey;
  nftMasterEdition: PublicKey;
  offsetMetadata: PublicKey;
  offsetTiers: PublicKey;
}
const getImpactNFTAccounts = async (
  config: SunriseStakeConfig,
  authority: PublicKey,
  program: Program<SunriseStake>
): Promise<ImpactNFTAccounts> => {
  const nftMintAuthority = findImpactNFTMintAuthority(config)[0];
  const nftMint = findImpactNFTMint(config, authority)[0];
  const impactNFTClient = await ImpactNftClient.get(
    program.provider as AnchorProvider,
    config.impactNFTStateAddress
  );
  const impactNftAccounts = impactNFTClient.getMintNftAccounts(
    nftMint,
    authority // holder
  );

  return {
    impactNftProgram: impactNftAccounts.program,
    tokenMetadataProgram: impactNftAccounts.tokenMetadataProgram,
    impactNftState: config.impactNFTStateAddress,
    nftMint,
    nftMintAuthority,
    nftMetadata: impactNftAccounts.metadata,
    nftHolderTokenAccount: impactNftAccounts.userTokenAccount,
    nftMasterEdition: impactNftAccounts.masterEdition,
    offsetMetadata: impactNftAccounts.offsetMetadata,
    offsetTiers: impactNftAccounts.offsetTiers,
  };
};

export const lockGSol = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey,
  sourceGSolTokenAccount: PublicKey,
  impactNFTConfig: EnvironmentConfig["impactNFT"],
  lamports: BN
): Promise<Transaction> => {
  const { lockAccountAddress, tokenAccountAddress, lockAccount } =
    await getLockAccount(config, program, authority);
  const [epochReportAccount] = findEpochReportAccount(config);

  type Accounts = Parameters<
    ReturnType<typeof program.methods.lockGsol>["accounts"]
  >[0];

  const preInstructions: TransactionInstruction[] = [];

  // the user has never locked before - they need a lock account and a lock token account
  if (!lockAccount) {
    const initLockAccount = await program.methods
      .initLockAccount()
      .accounts({
        state: config.stateAddress,
        authority,
        gsolMint: config.gsolMint,
        lockAccount: lockAccountAddress,
        lockGsolAccount: tokenAccountAddress,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    preInstructions.push(initLockAccount);
  }
  const allImpactNFTAccounts = await getImpactNFTAccounts(
    config,
    authority,
    program
  );
  const accounts: Accounts = {
    state: config.stateAddress,
    gsolMint: config.gsolMint,
    authority,
    sourceGsolAccount: sourceGSolTokenAccount,
    lockGsolAccount: tokenAccountAddress,
    lockAccount: lockAccountAddress,
    epochReportAccount,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: SYSVAR_CLOCK_PUBKEY,
    ...allImpactNFTAccounts,
  };

  return program.methods
    .lockGsol(lamports)
    .accounts(accounts)
    .preInstructions(preInstructions)
    .transaction();
};

export const updateLockAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey
): Promise<Transaction> => {
  const [lockAccount] = findLockAccount(config, authority);
  const [lockGSolTokenAccount] = findLockTokenAccount(config, authority);
  const [epochReportAccount] = findEpochReportAccount(config);

  type Accounts = Parameters<
    ReturnType<typeof program.methods.updateLockAccount>["accounts"]
  >[0];

  const allImpactNFTAccounts = await getImpactNFTAccounts(
    config,
    authority,
    program
  );
  const accounts: Accounts = {
    state: config.stateAddress,
    gsolMint: config.gsolMint,
    authority,
    lockGsolAccount: lockGSolTokenAccount,
    lockAccount,
    epochReportAccount,
    impactNftProgram: allImpactNFTAccounts.impactNftProgram,
    impactNftState: allImpactNFTAccounts.impactNftState,
    nftMint: allImpactNFTAccounts.nftMint,
    nftMintAuthority: allImpactNFTAccounts.nftMintAuthority,
    nftMetadata: allImpactNFTAccounts.nftMetadata,
    offsetMetadata: allImpactNFTAccounts.offsetMetadata,
    offsetTiers: allImpactNFTAccounts.offsetTiers,
  };

  console.log(accounts);

  return program.methods.updateLockAccount().accounts(accounts).transaction();
};

export const unlockGSol = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey,
  targetGSolTokenAccount: PublicKey
): Promise<Transaction> => {
  const [lockAccount] = findLockAccount(config, authority);
  const [lockGSolTokenAccount] = findLockTokenAccount(config, authority);
  const [epochReportAccount] = findEpochReportAccount(config);

  type Accounts = Parameters<
    ReturnType<typeof program.methods.unlockGsol>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: config.stateAddress,
    gsolMint: config.gsolMint,
    authority,
    targetGsolAccount: targetGSolTokenAccount,
    lockGsolAccount: lockGSolTokenAccount,
    lockAccount,
    epochReportAccount,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: SYSVAR_CLOCK_PUBKEY,
  };

  return program.methods.unlockGsol().accounts(accounts).transaction();
};
