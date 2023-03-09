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
  ComputeBudgetProgram,
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
import BN from "bn.js";
import { ImpactNftClient, type Level } from "@sunrisestake/impact-nft-client";
import { type EnvironmentConfig } from "./constants";
import { getEpochReportAccount } from "./marinade";

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
  nftTokenAuthority: PublicKey;
  nftMetadata: PublicKey;
  nftHolderTokenAccount: PublicKey;
  nftMasterEdition: PublicKey;
  offsetMetadata: PublicKey;
  offsetTiers: PublicKey;
  nftCollectionMint: PublicKey;
  nftCollectionMetadata: PublicKey;
  nftCollectionMasterEdition: PublicKey;
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

  const impactNftAccounts = await impactNFTClient.getMintNftAccounts(
    nftMint,
    authority // holder
  );

  return {
    impactNftProgram: impactNftAccounts.program,
    tokenMetadataProgram: impactNftAccounts.tokenMetadataProgram,
    impactNftState: config.impactNFTStateAddress,
    nftMint,
    nftMintAuthority,
    nftTokenAuthority: impactNftAccounts.tokenAuthority,
    nftMetadata: impactNftAccounts.metadata,
    nftHolderTokenAccount: impactNftAccounts.userTokenAccount,
    nftMasterEdition: impactNftAccounts.masterEdition,
    offsetMetadata: impactNftAccounts.offsetMetadata,
    offsetTiers: impactNftAccounts.offsetTiers,
    nftCollectionMint: impactNftAccounts.collectionMint,
    nftCollectionMetadata: impactNftAccounts.collectionMetadata,
    nftCollectionMasterEdition: impactNftAccounts.collectionMasterEdition,
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

  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 500000,
  });
  preInstructions.push(modifyComputeUnits);

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

  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 300000,
  });

  type Accounts = Parameters<
    ReturnType<typeof program.methods.updateLockAccount>["accounts"]
  >[0];

  const allImpactNFTAccounts = await getImpactNFTAccounts(
    config,
    authority,
    program
  );

  const impactNFTClient = await ImpactNftClient.get(
    program.provider as AnchorProvider,
    config.impactNFTStateAddress
  );

  const offset = await calculateUpdatedYieldAccrued(config, program, authority);

  // FIXME:
  // Gets the current collection for an nftMint and the expected updated
  // collection for a particular offset amount. This is already provided
  // by getUpdateNftAccounts in the impactNFT client but the logic there
  // seems to be faulty and should be updated to match the version used here.
  const newCollectionMint = await getUpdateCollectionForOffset(
    new BN(offset),
    impactNFTClient
  );
  const newCollectionMetadata =
    impactNFTClient.getMetadataAddress(newCollectionMint);
  const newCollectionMasterEdition =
    impactNFTClient.getMasterEditionAddress(newCollectionMint);

  const updateAccounts = await impactNFTClient.getUpdateNftAccounts(
    allImpactNFTAccounts.nftMint,
    new BN(offset)
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
    tokenProgram: TOKEN_PROGRAM_ID,
    tokenMetadataProgram: allImpactNFTAccounts.tokenMetadataProgram,
    // FIXME(redundant): Remove from here and the impactNft program.
    // It's neither used nor checked in the updateNFT instruction.
    nftTokenAccount: allImpactNFTAccounts.nftHolderTokenAccount,
    nftMint: allImpactNFTAccounts.nftMint,
    nftMintAuthority: allImpactNFTAccounts.nftMintAuthority,
    nftTokenAuthority: allImpactNFTAccounts.nftTokenAuthority,
    nftMetadata: allImpactNFTAccounts.nftMetadata,
    offsetMetadata: allImpactNFTAccounts.offsetMetadata,
    offsetTiers: allImpactNFTAccounts.offsetTiers,
    nftCollectionMint: updateAccounts.collectionMint,
    nftCollectionMetadata: updateAccounts.collectionMetadata,
    nftCollectionMasterEdition: updateAccounts.collectionMasterEdition,
    // nftNewCollectionMint: updateAccounts.newCollectionMint,
    // nftNewCollectionMetadata: updateAccounts.newCollectionMetadata,
    // nftNewCollectionMasterEdition: updateAccounts.newCollectionMasterEdition,
    nftNewCollectionMint: newCollectionMint,
    nftNewCollectionMetadata: newCollectionMetadata,
    nftNewCollectionMasterEdition: newCollectionMasterEdition,
  };

  return program.methods
    .updateLockAccount()
    .accounts(accounts)
    .preInstructions([modifyComputeUnits])
    .transaction();
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

const getUpdateCollectionForOffset = async (
  offset: BN,
  impactNFT: ImpactNftClient
): Promise<PublicKey> => {
  const offsetTiers = impactNFT.getOffsetTiersAddress();
  const account = await impactNFT.program.account.offsetTiers.fetch(
    offsetTiers
  );
  const levels = account.levels as Level[];

  if (levels.length === 1) {
    return levels[0].collectionMint;
  }

  for (let i = 0; i < levels.length; ++i) {
    if (levels[i].offset.gt(offset)) {
      return levels[i - 1].collectionMint;
    }
  }

  // return max offset
  return levels[levels.length - 1].collectionMint;
};

const calculateUpdatedYieldAccrued = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey
): Promise<BN> => {
  const epochReportAccount = await getEpochReportAccount(config, program).then(
    (res) => res.account
  );
  if (epochReportAccount === null)
    throw new Error("Epoch report account does not exist");

  const { lockAccount, tokenAccount } = await getLockAccount(
    config,
    program,
    authority
  );
  if (lockAccount === null)
    throw new Error("Lock account does not exist for user");
  if (tokenAccount === null)
    throw new Error("Lock gsol token account does not exist");

  const globalYieldAccrued = epochReportAccount.extractableYield
    .sub(epochReportAccount.extractedYield)
    .sub(lockAccount.sunriseYieldAtStart);

  const yieldAccruedWithUnstakeFee = globalYieldAccrued.muln(997).divn(1000);

  const userLockedGsol = new BN(tokenAccount.amount.toString());

  const userYieldAccrued = yieldAccruedWithUnstakeFee
    .mul(userLockedGsol)
    .div(epochReportAccount.currentGsolSupply);

  const updatedUserYieldAccrued =
    lockAccount.yieldAccruedByOwner.add(userYieldAccrued);

  return updatedUserYieldAccrued;
};
