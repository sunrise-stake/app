import {
  findImpactNFTMint,
  findImpactNFTMintAuthority,
  findLockAccount,
  findLockTokenAccount,
  getTokenAccountNullable,
  type SunriseStakeConfig,
  ZERO,
} from "./util.js";
import {
  ComputeBudgetProgram,
  type PublicKey,
  type Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import { type LockAccount } from "./types/LockAccount.js";
import {
  type AccountNamespace,
  type AnchorProvider,
  type Program,
} from "@coral-xyz/anchor";
import { type SunriseStake } from "./types/sunrise_stake.js";
import { type Account as TokenAccount } from "@solana/spl-token";
import BN from "bn.js";
import { ImpactNftClient, type Level } from "@sunrisestake/impact-nft-client";
import { getEpochReportAccount } from "./marinade.js";

export interface LockAccountSummary {
  lockAccountAddress: PublicKey;
  tokenAccountAddress: PublicKey;
  lockAccount: LockAccount | null; // null if not yet created
  tokenAccount: TokenAccount | null; // null if not yet created
  currentLevel: Level | null; // null if not yet created
  yieldToNextLevel: BN | null; // null if max level reached. 0 if not yet created
  unrealizedYield: BN | null; // null if not yet created
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
  lockTokenAccountAddress;
  lockTokenAccount: TokenAccount | null = null;

  lockAccountAddress;
  lockAccount: LockAccount | null = null;

  private impactNFTClient: ImpactNftClient | null = null;
  impactNFTDetails: Awaited<ReturnType<ImpactNftClient["details"]>> | null =
    null;

  constructor(
    readonly config: SunriseStakeConfig,
    readonly program: Program<SunriseStake>,
    readonly authority: PublicKey
  ) {
    const [lockTokenAccountAddress] = findLockTokenAccount(
      this.config,
      this.authority
    );
    this.lockTokenAccountAddress = lockTokenAccountAddress;

    const [lockAccountAddress] = findLockAccount(config, authority);
    this.lockAccountAddress = lockAccountAddress;
  }

  private toLockAccount(
    rawLockAccount: Awaited<
      ReturnType<AccountNamespace<SunriseStake>["lockAccount"]["fetchNullable"]>
    >
  ): LockAccount | null {
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

  public async refresh(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    const lockTokenAccountPromise = getTokenAccountNullable(
      this.program.provider.connection,
      this.lockTokenAccountAddress
    );

    const lockAccountPromise = this.program.account.lockAccount.fetchNullable(
      this.lockAccountAddress
    );

    // Allow for no impact nft state (e.g. in tests, to avoid circular dependencies)
    const impactNftClientPromise = this.config.impactNFTStateAddress
      ? ImpactNftClient.get(
          this.program.provider as AnchorProvider,
          this.config.impactNFTStateAddress
        )
      : Promise.resolve(null);

    const [lockTokenAccount, lockAccount, impactNFTClient] = await Promise.all([
      lockTokenAccountPromise,
      lockAccountPromise,
      impactNftClientPromise,
    ]);

    this.lockTokenAccount = lockTokenAccount;
    this.lockAccount = this.toLockAccount(lockAccount);
    this.impactNFTClient = impactNFTClient;
    this.impactNFTDetails = this.impactNFTClient
      ? this.impactNFTClient.details()
      : null;
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

  public async getLockedBalance(address: PublicKey): Promise<BN | null> {
    const [lockTokenAccountAddress] = findLockTokenAccount(
      this.config,
      address
    );
    const tokenAccount = await getTokenAccountNullable(
      this.program.provider.connection,
      lockTokenAccountAddress
    );

    if (!tokenAccount) {
      return null;
    }
    return new BN(tokenAccount.amount.toString(10));
  }

  public async getImpactNFTAccounts(): Promise<ImpactNFTAccounts> {
    if (!this.impactNFTClient || !this.config.impactNFTStateAddress)
      throw new Error(
        "LockClient not initialized or impact nft state disabled"
      );
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
  }

  public async lockGSol(
    sourceGSolTokenAccount: PublicKey,
    lamports: BN
  ): Promise<Transaction> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");

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
        })
        .instruction();

      preInstructions.push(initLockAccount);
    }
    const allImpactNFTAccounts = await this.getImpactNFTAccounts();
    const accounts: Accounts = {
      state: this.config.stateAddress,
      authority: this.authority,
      sourceGsolAccount: sourceGSolTokenAccount,
      lockAccount: this.lockAccountAddress,
      ...allImpactNFTAccounts,
    };

    return this.program.methods
      .lockGsol(lamports)
      .accounts(accounts)
      .preInstructions(preInstructions)
      .transaction();
  }

  /**
   * Returns the current level of the user's impact NFT
   * if they have one.
   */
  public getCurrentLevel(): Level | null {
    if (!this.lockAccount) return null; // no lock account yet

    if (!this.impactNFTClient || !this.impactNFTDetails)
      throw new Error("LockClient not initialized");

    return this.impactNFTClient.getLevelForOffset(
      this.lockAccount.yieldAccruedByOwner
    );
  }

  // Return the amount of yield that needs to be accrued (in lamports) to reach the next level
  // Or null if the user is already at the max level, or if impact nfts are disabled
  public getYieldToNextLevel(currentLevel?: number): BN | null {
    if (!this.impactNFTClient || !this.impactNFTDetails) return null; // impact nfts are disabled
    if (!this.lockAccount) return this.impactNFTDetails.levels[0].offset; // should be 0 for the first level

    return this.impactNFTClient.getAmountToNextOffset(
      this.lockAccount.yieldAccruedByOwner,
      currentLevel
    );
  }

  public async updateLockAccount(): Promise<Transaction> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");

    const allImpactNFTAccounts = await this.getImpactNFTAccounts();

    const offset = await this.calculateUpdatedYieldAccrued();

    try {
      const updateAccounts = await this.impactNFTClient.getUpdateNftAccounts(
        allImpactNFTAccounts.nftMint,
        new BN(offset)
      );

      return this.updateLockAccountWithNft(allImpactNFTAccounts, updateAccounts);
    } catch (error) {
      console.warn("Error retrieving NFT accounts - NFT likely moved or burned")
      return this.updateLockAccountWithoutNft()
    }
  }

  private async updateLockAccountWithNft(
    allImpactNFTAccounts: ImpactNFTAccounts,
    updateNftAccounts: Awaited<ReturnType<typeof ImpactNftClient.prototype.getUpdateNftAccounts>>,
  ): Promise<Transaction> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

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


    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.updateLockAccount>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.config.stateAddress,
      authority: this.authority,
      impactNftState: allImpactNFTAccounts.impactNftState,
      tokenMetadataProgram: allImpactNFTAccounts.tokenMetadataProgram,
      // FIXME(redundant): Remove from here and the impactNft program.
      // It's neither used nor checked in the updateNFT instruction.
      nftTokenAccount: allImpactNFTAccounts.nftHolderTokenAccount,
      nftTokenAuthority: allImpactNFTAccounts.nftTokenAuthority,
      nftMetadata: allImpactNFTAccounts.nftMetadata,
      offsetMetadata: allImpactNFTAccounts.offsetMetadata,
      offsetTiers: allImpactNFTAccounts.offsetTiers,
      nftCollectionMint: updateNftAccounts.collectionMint,
      nftCollectionMetadata: updateNftAccounts.collectionMetadata,
      nftCollectionMasterEdition: updateNftAccounts.collectionMasterEdition,
      // nftNewCollectionMint: updateAccounts.newCollectionMint,
      // nftNewCollectionMetadata: updateAccounts.newCollectionMetadata,
      // nftNewCollectionMasterEdition: updateAccounts.newCollectionMasterEdition,
      nftNewCollectionMint: newCollectionMint,
      nftNewCollectionMetadata: newCollectionMetadata,
      nftNewCollectionMasterEdition: newCollectionMasterEdition
    };

    return this.program.methods
      .updateLockAccount()
      .accounts(accounts)
      .preInstructions([modifyComputeUnits])
      .transaction();
  }

  private async updateLockAccountWithoutNft(): Promise<Transaction> {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    });

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.updateLockAccountWithoutNft>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.config.stateAddress,
      authority: this.authority,
    };

    return this.program.methods
      .updateLockAccountWithoutNft()
      .accounts(accounts)
      .preInstructions([modifyComputeUnits])
      .transaction();
  }

  public async addLockedGSol(
    sourceGSolTokenAccount: PublicKey,
    lamports: BN
  ): Promise<Transaction> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.lockGsol>["accounts"]
    >[0];

    const preInstructions: TransactionInstruction[] = [];

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 500000,
    });
    preInstructions.push(modifyComputeUnits);

    const allImpactNFTAccounts = await this.getImpactNFTAccounts();
    const accounts: Accounts = {
      state: this.config.stateAddress,
      authority: this.authority,
      sourceGsolAccount: sourceGSolTokenAccount,
      lockAccount: this.lockAccountAddress,
      ...allImpactNFTAccounts,
    };

    return this.program.methods
      .addLockedGsol(lamports)
      .accounts(accounts)
      .preInstructions(preInstructions)
      .transaction();
  }

  public async unlockGSol(
    targetGSolTokenAccount: PublicKey
  ): Promise<Transaction> {
    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.unlockGsol>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.config.stateAddress,
      authority: this.authority,
      targetGsolAccount: targetGSolTokenAccount,
    };

    return this.program.methods.unlockGsol().accounts(accounts).transaction();
  }

  public async getUpdateCollectionForOffset(offset: BN): Promise<PublicKey> {
    if (!this.impactNFTClient) throw new Error("LockClient not initialized");

    const level = this.impactNFTClient.getLevelForOffset(offset);

    // This can only happen if the lowest level has an offset > 0,
    // which in our case, is invalid (you get an NFT at level 0 as soon as you lock, at which point your
    // offset is 0)
    if (!level) {
      throw new Error(`No level found for offset ${offset.toString()}`);
    }

    return level.collectionMint;
  }

  /**
   * Given a lock account, calculate the amount of yield accrued since the last update.
   */
  public async calculateUpdatedYieldAccrued(): Promise<BN> {
    if (!this.lockAccount) throw new Error("User has no lock account");
    if (!this.lockTokenAccount)
      throw new Error("User has no lock token account");

    const epochReportAccount = await getEpochReportAccount(
      this.config,
      this.program
    ).then((res) => res.account);
    if (epochReportAccount === null)
      throw new Error("Epoch report account does not exist");

    const globalYieldAccruedSinceLastUpdate =
      epochReportAccount.extractableYield
        .add(epochReportAccount.extractedYield)
        .sub(this.lockAccount.sunriseYieldAtStart);

    const yieldAccruedWithUnstakeFee = globalYieldAccruedSinceLastUpdate
      .muln(997)
      .divn(1000);

    const userLockedGsol = new BN(this.lockTokenAccount.amount.toString());

    const userYieldAccrued = epochReportAccount.currentGsolSupply.eq(ZERO)
      ? ZERO
      : yieldAccruedWithUnstakeFee
          .mul(userLockedGsol)
          .div(epochReportAccount.currentGsolSupply);

    return this.lockAccount.yieldAccruedByOwner.add(userYieldAccrued);
  }
}
