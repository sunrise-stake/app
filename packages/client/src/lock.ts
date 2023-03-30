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
import {AccountNamespace, type AnchorProvider, type Program} from "@coral-xyz/anchor";
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

export interface GetLockAccountResult {
  lockAccountAddress: PublicKey;
  tokenAccountAddress: PublicKey;
  lockAccount: LockAccount | null; // null if not yet created
  tokenAccount: TokenAccount | null; // null if not yet created
}

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

export class LockClient {
  readonly lockTokenAccountAddress;
  private lockTokenAccount: TokenAccount | null = null;

  readonly lockAccountAddress;
  private lockAccount: LockAccount | null = null;

  private impactNFTClient: ImpactNftClient | null = null;
  private impactNFTDetails: Awaited<ReturnType<ImpactNftClient['details']>> | null = null;

  constructor(
      readonly config: SunriseStakeConfig,
      readonly program: Program<SunriseStake>,
      readonly authority: PublicKey,
  ) {
    const [lockTokenAccountAddress] = findLockTokenAccount(this.config, this.authority);
    this.lockTokenAccountAddress = lockTokenAccountAddress;

    const [lockAccountAddress] = findLockAccount(config, authority);
    this.lockAccountAddress = lockAccountAddress;
  }

  private toLockAccount(rawLockAccount: Awaited<ReturnType<AccountNamespace<SunriseStake>['lockAccount']['fetchNullable']>>): LockAccount | null {
    if (!rawLockAccount) return null;
    return {
      address: this.lockAccountAddress,
      authority: this.authority,
      lockTokenAccount: rawLockAccount.tokenAccount,
      startEpoch: rawLockAccount.startEpoch,
      updatedToEpoch: rawLockAccount.updatedToEpoch,
      stateAddress: rawLockAccount.stateAddress,
      sunriseYieldAtStart: rawLockAccount.sunriseYieldAtStart,
      yieldAccruedByOwner: rawLockAccount.yieldAccruedByOwner,
    };
  }

  private async init() {
    const lockTokenAccountPromise = getTokenAccountNullable(
        this.program.provider.connection,
        this.lockTokenAccountAddress
    );

    const lockAccountPromise = this.program.account.lockAccount.fetchNullable(this.lockAccountAddress);

    const impactNftClientPromise = ImpactNftClient.get(
        this.program.provider as AnchorProvider,
        this.config.impactNFTStateAddress
    );

    const [
      lockTokenAccount,
      lockAccount,
      impactNFTClient
    ] = await Promise.all([lockTokenAccountPromise, lockAccountPromise, impactNftClientPromise]);

    this.lockTokenAccount = lockTokenAccount;
    this.lockAccount = this.toLockAccount(lockAccount);
    this.impactNFTClient = impactNFTClient;
    this.impactNFTDetails = await this.impactNFTClient.details();
  }

  public static async build(
      config: SunriseStakeConfig,
      program: Program<SunriseStake>,
      authority: PublicKey
  ): Promise<LockClient> {
    const client = new LockClient(config, program, authority);
    await client.init();
    return client;
  }

  public async getImpactNFTAccounts(): Promise<ImpactNFTAccounts> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");
    const nftMintAuthority = findImpactNFTMintAuthority(this.config)[0];
    const nftMint = findImpactNFTMint(this.config, this.authority)[0];

    const impactNftAccounts = await this.impactNFTClient.getMintNftAccounts(
        nftMint,
        this.authority // holder
    );

    return {
      impactNftProgram: impactNftAccounts.program,
      tokenMetadataProgram: impactNftAccounts.tokenMetadataProgram,
      impactNftState: this.config.impactNFTStateAddress,
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

  public async lockGSol(
      sourceGSolTokenAccount: PublicKey,
      impactNFTConfig: EnvironmentConfig["impactNFT"],
      lamports: BN
  ): Promise<Transaction> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");
    const [epochReportAccount] = findEpochReportAccount(this.config);

    type Accounts = Parameters<
        ReturnType<typeof this.program.methods.lockGsol>["accounts"]
    >[0];

    const preInstructions: TransactionInstruction[] = [];

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 500000,
    });
    preInstructions.push(modifyComputeUnits);

    // the user has never locked before - they need a lock account and a lock token account
    if (!this.lockAccount) {
      const initLockAccount = await this.program.methods
          .initLockAccount()
          .accounts({
            state: this.config.stateAddress,
            authority: this.authority,
            gsolMint: this.config.gsolMint,
            lockAccount: this.lockAccountAddress,
            lockGsolAccount: this.lockTokenAccountAddress,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .instruction();

      preInstructions.push(initLockAccount);
    }
    const allImpactNFTAccounts = await this.getImpactNFTAccounts();
    const accounts: Accounts = {
      state: this.config.stateAddress,
      gsolMint: this.config.gsolMint,
      authority: this.authority,
      sourceGsolAccount: sourceGSolTokenAccount,
      lockGsolAccount: this.lockTokenAccountAddress,
      lockAccount: this.lockAccountAddress,
      epochReportAccount,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: SYSVAR_CLOCK_PUBKEY,
      ...allImpactNFTAccounts,
    };

    return this.program.methods
        .lockGsol(lamports)
        .accounts(accounts)
        .preInstructions(preInstructions)
        .transaction();
  };

  public async updateLockAccount(): Promise<Transaction> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");
    const [epochReportAccount] = findEpochReportAccount(this.config);

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

    type Accounts = Parameters<
        ReturnType<typeof this.program.methods.updateLockAccount>["accounts"]
    >[0];

    const allImpactNFTAccounts = await this.getImpactNFTAccounts();

    const offset = await this.calculateUpdatedYieldAccrued();

    // FIXME:
    // Gets the current collection for an nftMint and the expected updated
    // collection for a particular offset amount. This is already provided
    // by getUpdateNftAccounts in the impactNFT client but the logic there
    // seems to be faulty and should be updated to match the version used here.
    const newCollectionMint = await this.getUpdateCollectionForOffset(
        new BN(offset)
    );
    const newCollectionMetadata =
        this.impactNFTClient.getMetadataAddress(newCollectionMint);
    const newCollectionMasterEdition =
        this.impactNFTClient.getMasterEditionAddress(newCollectionMint);

    const updateAccounts = await this.impactNFTClient.getUpdateNftAccounts(
        allImpactNFTAccounts.nftMint,
        new BN(offset)
    );

    console.log("updateAccounts", updateAccounts);

    const accounts: Accounts = {
      state: this.config.stateAddress,
      gsolMint: this.config.gsolMint,
      authority: this.authority,
      lockGsolAccount: this.lockTokenAccountAddress,
      lockAccount: this.lockAccountAddress,
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

    return this.program.methods
        .updateLockAccount()
        .accounts(accounts)
        .preInstructions([modifyComputeUnits])
        .transaction();
  };

  public async unlockGSol(
      config: SunriseStakeConfig,
      program: Program<SunriseStake>,
      authority: PublicKey,
      targetGSolTokenAccount: PublicKey
  ): Promise<Transaction> {
    const [epochReportAccount] = findEpochReportAccount(config);

    type Accounts = Parameters<
        ReturnType<typeof this.program.methods.unlockGsol>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.config.stateAddress,
      gsolMint: this.config.gsolMint,
      authority: this.authority,
      targetGsolAccount: targetGSolTokenAccount,
      lockGsolAccount: this.lockTokenAccountAddress,
      lockAccount: this.lockAccountAddress,
      epochReportAccount,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: SYSVAR_CLOCK_PUBKEY,
    };

    return this.program.methods.unlockGsol().accounts(accounts).transaction();
  };

  public async getUpdateCollectionForOffset(
      offset: BN,
  ): Promise<PublicKey> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");
    const offsetTiers = this.impactNFTClient.getOffsetTiersAddress();
    const account = await this.impactNFTClient.program.account.offsetTiers.fetch(
        offsetTiers
    );
    const levels = account.levels as Level[];

    console.log(
        "getUpdateCollectionForOffset levels:",
        levels.map((l) => l.offset.toNumber())
    );
    console.log("getUpdateCollectionForOffset offset:", offset.toString());

    // TODO: Handle a user's offset being less than the minimum level's offset

    if (levels.length === 1) {
      return levels[0].collectionMint;
    }

    for (let i = 0; i < levels.length; ++i) {
      console.log(
          "getUpdateCollectionForOffset level offset:",
          levels[i].offset.toString(),
          i
      );
      if (levels[i].offset.gt(offset)) {
        console.log("getUpdateCollectionForOffset returning: ", i - 1);
        return levels[i - 1].collectionMint;
      }
    }

    // return max offset
    return levels[levels.length - 1].collectionMint;
  };

  public async calculateUpdatedYieldAccrued(): Promise<BN> {
    if (!this.lockAccount) throw new Error("User has no lock account");
    if (!this.lockTokenAccount) throw new Error("User has no lock account");

    const epochReportAccount = await getEpochReportAccount(this.config, this.program).then(
        (res) => res.account
    );
    if (epochReportAccount === null)
      throw new Error("Epoch report account does not exist");

    const globalYieldAccruedSinceLastUpdate = epochReportAccount.extractableYield
        .add(epochReportAccount.extractedYield)
        .sub(this.lockAccount.sunriseYieldAtStart);

    const yieldAccruedWithUnstakeFee = globalYieldAccruedSinceLastUpdate
        .muln(997)
        .divn(1000);

    const userLockedGsol = new BN(this.lockTokenAccount.amount.toString());

    const userYieldAccrued = yieldAccruedWithUnstakeFee
        .mul(userLockedGsol)
        .div(epochReportAccount.currentGsolSupply);

    const updatedUserYieldAccrued =
        this.lockAccount.yieldAccruedByOwner.add(userYieldAccrued);

    console.log("user yield calculations", {
      globalYieldAccrued: globalYieldAccruedSinceLastUpdate.toString(),
      yieldAccruedByOwner: this.lockAccount.yieldAccruedByOwner.toString(),
      yieldAccruedWithUnstakeFee: yieldAccruedWithUnstakeFee.toString(),
      userLockedGsol: userLockedGsol.toString(),
      currentGsolSupply: epochReportAccount.currentGsolSupply.toString(),
      userYieldAccrued: userYieldAccrued.toString(),
      updatedUserYieldAccrued: updatedUserYieldAccrued.toString(),
    });

    return updatedUserYieldAccrued;
  };
}
