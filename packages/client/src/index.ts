import { IDL, type SunriseStake } from "./types/sunrise_stake";
import * as anchor from "@coral-xyz/anchor";
import { type AnchorProvider, Program, utils } from "@coral-xyz/anchor";
import {
  type ConfirmOptions,
  Keypair,
  PublicKey,
  type Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  confirm,
  findAllTickets,
  findBSolTokenAccountAuthority,
  findEpochReportAccount,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  logKeys,
  marinadeTargetReached,
  type Options,
  PROGRAM_ID,
  proportionalBN,
  setUpAnchor,
  ZERO,
  ZERO_BALANCE,
  toSol,
  findImpactNFTMintAuthority,
  getImpactNFT,
  zip,
} from "./util";
import {
  Marinade,
  MarinadeConfig,
  type MarinadeState,
} from "@sunrisestake/marinade-ts-sdk";
import BN from "bn.js";
import { 
  type SunriseStakeConfig, 
  type SunriseTokenConfig, 
} from "./types/Config";
import {
  type Balance,
  type Details,
  type WithdrawalFees,
} from "./types/Details";
import {
  type SunriseTicketAccountFields,
  type TicketAccount,
} from "./types/TicketAccount";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  DEFAULT_LP_MIN_PROPORTION,
  DEFAULT_LP_PROPORTION,
  EMPTY_EPOCH_REPORT,
  Environment,
  type EnvironmentConfig,
  MARINADE_TICKET_RENT,
  NETWORK_FEE,
  SOLBLAZE_ENABLED,
  STAKE_POOL_PROGRAM_ID,
} from "./constants";
import {
  deposit,
  depositStakeAccount,
  liquidUnstake,
  triggerRebalance,
  getEpochReportAccount,
} from "./marinade";
import {
  blazeDeposit,
  blazeDepositStake,
  blazeWithdrawSol,
  blazeWithdrawStake,
} from "./blaze";
import { type BlazeState } from "./types/Solblaze";
import { getStakePoolAccount, type StakePool } from "./decodeStakePool";
import { type EpochReportAccount } from "./types/EpochReportAccount";
import { LockClient, type LockAccountSummary } from "./lock";

// export getStakePoolAccount
export { getStakePoolAccount, type StakePool };

// export all types
export * from "./types/sunrise_stake";
export * from "./types/Details";
export * from "./types/TicketAccount";
export * from "./types/EpochReportAccount";
export * from "./types/Solblaze";

// export all constants
export * from "./constants";

export { toSol, findImpactNFTMintAuthority, ZERO_BALANCE } from "./util";

export class SunriseStakeClient {
  readonly program: Program<SunriseStake>;
  config: SunriseStakeConfig | undefined;
  tokenConfig: SunriseTokenConfig | undefined;

  // TODO make private once all functions are moved in here
  marinade: Marinade | undefined;
  marinadeState: MarinadeState | undefined;

  // TODO move to config?
  readonly staker: PublicKey;
  stakerGSolTokenAccount: PublicKey | undefined;

  blazeState: BlazeState | undefined;
  lockClient: LockClient | undefined;

  readonly env: EnvironmentConfig;

  private constructor(
    readonly provider: AnchorProvider,
    env: EnvironmentConfig,
    readonly options: Options = {}
  ) {
    this.program = new Program<SunriseStake>(IDL, PROGRAM_ID, provider);
    this.staker = this.provider.publicKey;
    this.env = {
      ...env,
      ...options.environmentOverrides,
    };
  }

  private log(...args: any[]): void {
    Boolean(this.config?.options.verbose) && console.log(...args);
  }

  // refresh the client's internal state
  public async refresh(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    const sunriseStakeState = await this.program.account.state.fetch(
      this.env.state
    );

    this.stakerGSolTokenAccount = PublicKey.findProgramAddressSync(
      [
        this.staker.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        sunriseStakeState.gsolMint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];

    this.config = {
      gsolMint: sunriseStakeState.gsolMint,
      treasury: sunriseStakeState.treasury,
      programId: this.program.programId,
      stateAddress: this.env.state,
      updateAuthority: sunriseStakeState.updateAuthority,
      liqPoolProportion: sunriseStakeState.liqPoolProportion,
      liqPoolMinProportion: sunriseStakeState.liqPoolMinProportion,
      impactNFTStateAddress: this.env.impactNFT.state,
      options: this.options,
    };
    this.tokenConfig = await this.getTokenConfig(this.config);

    [this.marinade, this.marinadeState] = await this.makeMarinade();

    this.blazeState = await this.makeBlaze();

    this.lockClient = await LockClient.build(
      this.config,
      this.program,
      this.staker
    );
  }

  private async getTokenConfig(
    config: SunriseStakeConfig
  ): Promise<SunriseTokenConfig> {
    const gsolMintAuthority = findGSolMintAuthority(config);

    const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config);
    const msolTokenAccount = await utils.token.associatedAddress({
      mint: this.env.marinade.msolMintAddress,
      owner: msolTokenAccountAuthority[0],
    });

    const liqPoolTokenAccount = await utils.token.associatedAddress({
      mint: this.env.marinade.lpMintAddress,
      owner: msolTokenAccountAuthority[0],
    });

    const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config);
    const bsolTokenAccount = await utils.token.associatedAddress({
      mint: this.env.blaze.bsolMint,
      owner: bsolTokenAccountAuthority[0],
    });

    return {
      gsolMintAuthority,
      msolTokenAccount,
      msolTokenAccountAuthority,
      liqPoolTokenAccount,
      bsolTokenAccount,
      bsolTokenAccountAuthority,
    };
  }

  private async makeMarinade(): Promise<[Marinade, MarinadeState]> {
    if (!this.config || !this.tokenConfig) throw new Error("Init not called");

    const marinadeConfig = new MarinadeConfig({
      connection: this.provider.connection,
      publicKey: this.provider.publicKey,
      proxyStateAddress: this.env.state,
      proxySolMintAuthority: this.tokenConfig.gsolMintAuthority[0],
      proxySolMintAddress: this.config.gsolMint,
      msolTokenAccountAuthority: this.tokenConfig.msolTokenAccountAuthority[0],
      proxyTreasury: this.config.treasury,
    });

    const marinade = new Marinade(marinadeConfig);
    const marinadeState = await marinade.getMarinadeState();

    return [marinade, marinadeState];
  }

  // TODO
  private async makeBlaze(): Promise<BlazeState> {
    const stakePoolInfo = await getStakePoolAccount(
      this.provider.connection,
      this.env.blaze.pool
    );

    const [withdrawAuthority] = PublicKey.findProgramAddressSync(
      [this.env.blaze.pool.toBuffer(), Buffer.from("withdraw")],
      STAKE_POOL_PROGRAM_ID
    );
    const [depositAuthority] = PublicKey.findProgramAddressSync(
      [this.env.blaze.pool.toBuffer(), Buffer.from("deposit")],
      STAKE_POOL_PROGRAM_ID
    );

    return {
      pool: this.env.blaze.pool,
      bsolMint: stakePoolInfo.poolMint,
      validatorList: stakePoolInfo.validatorList,
      reserveAccount: stakePoolInfo.reserveStake,
      managerAccount: stakePoolInfo.manager,
      feesDepot: stakePoolInfo.managerFeeAccount,
      withdrawAuthority,
      depositAuthority,
    };
  }

  public async sendAndConfirmTransaction(
    transaction: Transaction,
    signers?: Signer[],
    opts?: ConfirmOptions
  ): Promise<string> {
    return this.provider
      .sendAndConfirm(transaction, signers, opts)
      .catch((e) => {
        this.log(e.logs);
        throw e;
      });
  }

  /**
   * Send and confirm multiple transactions in sequence
   *
   * @param transactions
   * @param signers
   * @param opts
   * @param withRefresh Refresh the client's internal state after sending the transactions (default: false)
   */
  public async sendAndConfirmTransactions(
    transactions: Transaction[],
    signers: Signer[][] = [],
    opts?: ConfirmOptions,
    withRefresh = false
  ): Promise<string[]> {
    const txesWithSigners = zip(transactions, signers, []);
    const txSigs: string[] = [];

    this.log("Sending transactions: ", transactions.length);
    for (const [tx, signers] of txesWithSigners) {
      const txSig = await this.sendAndConfirmTransaction(tx, signers, opts);
      this.log("Transaction sent: ", txSig);
      txSigs.push(txSig);
    }

    if (withRefresh) {
      await this.refresh();
    }

    return txSigs;
  }

  createGSolTokenAccountIx(
    account = this.stakerGSolTokenAccount,
    authority = this.staker
  ): TransactionInstruction {
    if (!account || !this.config) throw new Error("init not called");

    return createAssociatedTokenAccountIdempotentInstruction(
      this.provider.publicKey,
      account,
      authority,
      this.config.gsolMint
    );
  }

  public async makeBalancedDeposit(
    lamports: BN,
    recipient?: PublicKey
  ): Promise<Transaction> {
    const details = await this.details();
    if (
      marinadeTargetReached(details, this.env.percentageStakeToMarinade) &&
      SOLBLAZE_ENABLED
    ) {
      console.log("Routing deposit to Solblaze");
      return this.depositToBlaze(lamports, recipient);
    }
    console.log("Depositing to marinade");
    return this.deposit(lamports, recipient);
  }

  public async deposit(
    lamports: BN,
    recipient?: PublicKey
  ): Promise<Transaction> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    const recipientAuthority = recipient ?? this.staker;
    const recipientGsolTokenAccountAddress = recipient
      ? await utils.token.associatedAddress({
          mint: this.config.gsolMint,
          owner: recipientAuthority,
        })
      : this.stakerGSolTokenAccount;

    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      recipientGsolTokenAccountAddress
    );

    const transaction = new Transaction();

    if (!gsolTokenAccount) {
      const createUserTokenAccount = this.createGSolTokenAccountIx(
        recipientGsolTokenAccountAddress,
        recipient
      );
      transaction.add(createUserTokenAccount);
    }

    const depositTx = await deposit(
      this.config,
      this.program,
      this.marinade,
      this.marinadeState,
      this.config.stateAddress,
      this.provider.publicKey,
      recipientGsolTokenAccountAddress,
      lamports
    );

    transaction.add(depositTx);

    return transaction;
  }

  public async depositToBlaze(
    lamports: BN,
    recipient?: PublicKey
  ): Promise<Transaction> {
    if (!this.config || !this.stakerGSolTokenAccount || !this.blazeState)
      throw new Error("init not called");

    const recipientAuthority = recipient ?? this.staker;
    const recipientGsolTokenAccountAddress = recipient
      ? await utils.token.associatedAddress({
          mint: this.config.gsolMint,
          owner: recipientAuthority,
        })
      : this.stakerGSolTokenAccount;
    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      recipientGsolTokenAccountAddress
    );

    const transaction = new Transaction();

    if (!gsolTokenAccount) {
      const createUserTokenAccount = this.createGSolTokenAccountIx(
        recipientGsolTokenAccountAddress,
        recipient
      );
      transaction.add(createUserTokenAccount);
    }

    const depositTx = await blazeDeposit(
      this.config,
      this.program,
      this.blazeState,
      this.provider.publicKey,
      recipientGsolTokenAccountAddress,
      lamports
    );

    transaction.add(depositTx);

    return transaction;
  }

  public async depositStakeToBlaze(
    stakeAccountAddress: PublicKey
  ): Promise<Transaction> {
    if (!this.config || !this.stakerGSolTokenAccount || !this.blazeState)
      throw new Error("init not called");

    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      this.stakerGSolTokenAccount
    );

    const transaction = new Transaction();

    if (!gsolTokenAccount) {
      const createUserTokenAccount = this.createGSolTokenAccountIx();
      transaction.add(createUserTokenAccount);
    }

    const depositTx = await blazeDepositStake(
      this.config,
      this.program,
      this.provider,
      this.blazeState,
      this.provider.publicKey,
      stakeAccountAddress,
      this.stakerGSolTokenAccount
    );

    transaction.add(depositTx);
    return transaction;
  }

  public async depositStakeAccount(
    stakeAccountAddress: PublicKey
  ): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    const transaction = new Transaction();

    const gSolTokenAccount = await this.provider.connection.getAccountInfo(
      this.stakerGSolTokenAccount
    );

    if (!gSolTokenAccount) {
      const createUserTokenAccount = this.createGSolTokenAccountIx();
      transaction.add(createUserTokenAccount);
    }

    const depositStakeIx = await depositStakeAccount(
      this.config,
      this.program,
      this.marinade,
      this.marinadeState,
      this.provider.publicKey,
      stakeAccountAddress,
      this.stakerGSolTokenAccount
    );

    console.log("Depositing Stake Account...");
    transaction.add(depositStakeIx);
    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async unstake(lamports: BN): Promise<Transaction> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.stakerGSolTokenAccount ||
      !this.blazeState
    )
      throw new Error("init not called");

    const transaction = await liquidUnstake(
      this.config,
      this.blazeState,
      this.marinade,
      this.marinadeState,
      this.program,
      this.env.state,
      this.staker,
      this.stakerGSolTokenAccount,
      lamports
    );

    Boolean(this.config?.options.verbose) && logKeys(transaction);

    return transaction;
  }

  // Recover delayed unstake tickets from rebalances in the previous epoch, if necessary
  // Note, even if there are no tickets to recover, if the epoch report references the previous epoch
  // we call this instruction anyway as part of triggerRebalance, to update the epoch.
  async recoverTickets(): Promise<TransactionInstruction | null> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.tokenConfig ||
      !this.stakerGSolTokenAccount ||
      !this.blazeState
    )
      throw new Error("init not called");

    const marinadeProgram = this.marinade.marinadeFinanceProgram.programAddress;

    // check the most recent epoch report account
    // if it is not for the current epoch, then we may need to recover tickets
    const { address: epochReportAccountAddress, account: epochReport } =
      await getEpochReportAccount(this.config, this.program);
    const currentEpoch = await this.program.provider.connection.getEpochInfo();

    if (!epochReport) {
      // no epoch report account found at all - something went wrong
      throw new Error("No epoch report account found during recoverTickets");
    }

    this.log(
      `Current epoch: ${
        currentEpoch.epoch
      }, epoch report epoch: ${epochReport.epoch.toNumber()}`
    );
    if (currentEpoch.epoch === epochReport.epoch.toNumber()) {
      // nothing to do here - the report account is for the current epoch, so we cannot recover any tickets yet
      this.log("Skipping recoverTickets, epoch report is for current epoch");
      return null;
    } else {
      this.log(
        "Updating epoch report account and recovering tickets from previous epoch"
      );
    }

    // get a list of all the open delayed unstake tickets that can now be recovered
    const previousEpochTickets = await findAllTickets(
      this.program.provider.connection,
      this.config,
      // change BigInt(1) to 1n when we target ES2020 in tsconfig.json
      BigInt(epochReport.epoch.toString()),
      epochReport.tickets.toNumber()
    );

    const previousEpochTicketAccountMetas = previousEpochTickets.map(
      (ticket) => ({
        pubkey: ticket,
        isSigner: false,
        isWritable: true,
      })
    );

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.recoverTickets>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.config.stateAddress,
      payer: this.staker,
      marinadeState: this.marinadeState.marinadeStateAddress,
      blazeState: this.blazeState.pool,
      gsolMint: this.config.gsolMint,
      msolMint: this.marinadeState.mSolMint.address,
      bsolMint: this.blazeState.bsolMint,
      liqPoolMint: this.marinadeState.lpMint.address,
      liqPoolMintAuthority: await this.marinadeState.lpMintAuthority(),
      liqPoolSolLegPda: await this.marinadeState.solLeg(),
      liqPoolMsolLeg: this.marinadeState.mSolLeg,
      liqPoolMsolLegAuthority: await this.marinadeState.mSolLegAuthority(),
      liqPoolTokenAccount: this.tokenConfig.liqPoolTokenAccount,
      reservePda: await this.marinadeState.reserveAddress(),
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.tokenConfig.msolTokenAccount,
      getMsolFromAuthority: this.tokenConfig.msolTokenAccountAuthority[0],
      getBsolFrom: this.tokenConfig.bsolTokenAccount,
      getBsolFromAuthority: this.tokenConfig.bsolTokenAccountAuthority[0],
      epochReportAccount: epochReportAccountAddress,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: SYSVAR_CLOCK_PUBKEY,
      marinadeProgram,
    };

    return this.program.methods
      .recoverTickets()
      .accounts(accounts)
      .remainingAccounts(previousEpochTicketAccountMetas)
      .instruction();
  }

  /**
   * Trigger a rebalance without doing anything else.
   */
  public async triggerRebalance(): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    const recoverInstruction = await this.recoverTickets();

    const { instruction: rebalanceInstruction } = await triggerRebalance(
      this.config,
      this.marinade,
      this.marinadeState,
      this.program,
      this.env.state,
      this.provider.publicKey
    );

    const instructions = [recoverInstruction, rebalanceInstruction].filter(
      Boolean
    ) as TransactionInstruction[];
    const transaction = new Transaction().add(...instructions);
    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async report(): Promise<void> {
    const details = await this.details();

    const inflightTotal = details.epochReport.totalOrderedLamports;

    const totalValue = details.mpDetails.msolValue
      .add(details.bpDetails.bsolValue)
      .add(details.lpDetails.lpSolValue)
      .add(inflightTotal);

    const mpShare =
      details.mpDetails.msolValue.muln(10_000).div(totalValue).toNumber() / 100;
    const bpShare =
      details.bpDetails.bsolValue.muln(10_000).div(totalValue).toNumber() / 100;
    const lpShare =
      details.lpDetails.lpSolValue.muln(10_000).div(totalValue).toNumber() /
      100;
    const inflightShare =
      inflightTotal.muln(10_000).div(totalValue).toNumber() / 100;

    const missingValue = totalValue.sub(
      new BN(details.balances.gsolSupply.amount)
    );
    const missingValueShare =
      missingValue.muln(10_000).div(totalValue).toNumber() / 100;

    const report: Record<string, string> = {
      "gSOL Supply": details.balances.gsolSupply.uiAmountString ?? "-",
      "Marinade Stake Pool Value": `${toSol(
        details.mpDetails.msolValue
      )} (${mpShare.toString()}%)`,
      "SolBlaze Stake Pool Value": `${toSol(
        details.bpDetails.bsolValue
      )} (${bpShare.toString()}%)`,
      "Liquidity Pool Value": `${toSol(
        details.lpDetails.lpSolValue
      )} (${lpShare.toString()}%)`,
      "Total Value": `${toSol(totalValue)}`,
      "Open Orders": `${details.epochReport.tickets.toNumber()}`,
      "Open Order value": `${toSol(
        inflightTotal
      )} (${inflightShare.toString()}%)`,
      "Extractable Yield (calculated)": `${toSol(
        missingValue
      )} (${missingValueShare.toString()}%)`,
      "Extractable Yield": `${toSol(details.extractableYield)}`,
      "Epoch Report Epoch": `${details.epochReport.epoch.toNumber()}`,
      "Current Epoch": `${details.currentEpoch.epoch}`,
      "Epoch Report Tickets": `${details.epochReport.tickets.toNumber()}`,
    };

    Object.keys(report).forEach((key) => {
      this.log(key, ":", report[key]);
    });
  }

  public async orderUnstake(lamports: BN): Promise<[Transaction, Keypair[]]> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.tokenConfig
    )
      throw new Error("init not called");

    const { transaction, newTicketAccount, proxyTicketAccount } =
      await this.marinade.orderUnstake(lamports, this.tokenConfig.msolTokenAccount);

    Boolean(this.config?.options.verbose) && logKeys(transaction);

    return [transaction, [newTicketAccount, proxyTicketAccount]];
  }

  private async toTicketAccount(
    sunriseTicketAccount: SunriseTicketAccountFields,
    address: PublicKey
  ): Promise<TicketAccount> {
    const marinadeTicketAccount = await this.marinade?.getDelayedUnstakeTicket(
      sunriseTicketAccount.marinadeTicketAccount
    );

    if (!marinadeTicketAccount)
      throw new Error(
        `Marinade ticket with address ${sunriseTicketAccount.marinadeTicketAccount.toString()} not found`
      );

    return {
      address,
      ...sunriseTicketAccount,
      ...marinadeTicketAccount,
    };
  }

  public async getDelayedUnstakeTickets(): Promise<TicketAccount[]> {
    if (!this.marinade) throw new Error("init not called");

    const beneficiary = this.provider.publicKey;

    const ticketAccounts = await this.program.account.sunriseTicketAccount.all([
      {
        memcmp: {
          offset: 8 + 32 + 32,
          bytes: beneficiary.toBase58(),
        },
      },
    ]);

    const resolvedTicketAccountPromises = ticketAccounts.map(
      async ({ account, publicKey }) => this.toTicketAccount(account, publicKey)
    );

    return Promise.all(resolvedTicketAccountPromises) as Promise<
      TicketAccount[]
    >;
  }

  public async claimUnstakeTicket(
    ticketAccount: TicketAccount
  ): Promise<Transaction> {
    if (!this.marinade || !this.marinadeState || !this.tokenConfig)
      throw new Error("init not called");

    const reservePda = await this.marinadeState.reserveAddress();
    const marinadeProgram = this.marinade.marinadeFinanceProgram.programAddress;

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.claimUnstakeTicket>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.env.state,
      marinadeState: this.marinadeState.marinadeStateAddress,
      reservePda,
      marinadeTicketAccount: ticketAccount.marinadeTicketAccount,
      sunriseTicketAccount: ticketAccount.address,
      msolAuthority: this.tokenConfig.msolTokenAccountAuthority[0],
      transferSolTo: this.staker,
      systemProgram: SystemProgram.programId,
      clock: SYSVAR_CLOCK_PUBKEY,
      marinadeProgram,
    };

    const transaction = await this.program.methods
      .claimUnstakeTicket()
      .accounts(accounts)
      .transaction();

    Boolean(this.config?.options.verbose) && logKeys(transaction);

    return transaction;
  }

  public async withdrawFromBlaze(amount: BN): Promise<string> {
    if (
      !this.blazeState ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    const withdrawIx = await blazeWithdrawSol(
      this.config,
      this.program,
      this.blazeState,
      this.provider.publicKey,
      this.stakerGSolTokenAccount,
      amount
    );

    const transaction = new Transaction().add(withdrawIx);
    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async withdrawStakeFromBlaze(
    newStakeAccount: PublicKey,
    amount: BN
  ): Promise<string> {
    if (
      !this.blazeState ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    const withdrawStakeIx = await blazeWithdrawStake(
      this.config,
      this.program,
      this.blazeState,
      newStakeAccount,
      this.provider.publicKey,
      this.stakerGSolTokenAccount,
      amount
    );

    const transaction = new Transaction().add(withdrawStakeIx);
    return this.sendAndConfirmTransaction(transaction, []);
  }

  // This should be done only once per state, and must be signed by the update authority
  public async initEpochReport(): Promise<string> {
    if (
      !this.marinadeState ||
      !this.blazeState ||
      !this.marinade ||
      !this.config ||
      !this.tokenConfig
    ) {
      throw new Error("init not called");
    }

    const liqPoolSolLegPda = await this.marinadeState.solLeg();

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.initEpochReport>["accounts"]
    >[0];

    const [epochReportAccountAddress] = findEpochReportAccount(this.config);

    const accounts: Accounts = {
      state: this.env.state,
      marinadeState: this.marinadeState.marinadeStateAddress,
      blazeState: this.blazeState.pool,
      msolMint: this.marinadeState.mSolMintAddress,
      gsolMint: this.config.gsolMint,
      bsolMint: this.blazeState.bsolMint,
      liqPoolMint: this.marinadeState.lpMint.address,
      liqPoolSolLegPda,
      liqPoolMsolLeg: this.marinadeState.mSolLeg,
      liqPoolTokenAccount: this.tokenConfig.liqPoolTokenAccount,
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.tokenConfig.msolTokenAccount,
      getMsolFromAuthority: this.tokenConfig.msolTokenAccountAuthority[0],
      getBsolFrom: this.tokenConfig.bsolTokenAccount,
      getBsolFromAuthority: this.tokenConfig.bsolTokenAccountAuthority[0],
      epochReportAccount: epochReportAccountAddress,
      treasury: this.config.treasury,
      systemProgram: SystemProgram.programId,
    };

    return this.program.methods
      .initEpochReport(new BN(0))
      .accounts(accounts)
      .rpc();
  }

  public async getEpochReport(): Promise<EpochReportAccount> {
    if (!this.config) {
      throw new Error("init not called");
    }

    const { account } = await getEpochReportAccount(this.config, this.program);

    // The update authority must create the epoch report account for this sunrise state instance
    if (!account) throw new Error("Epoch report account not found");

    return account;
  }

  public async extractYieldIx(): Promise<TransactionInstruction> {
    if (
      !this.marinadeState ||
      !this.blazeState ||
      !this.marinade ||
      !this.config ||
      !this.tokenConfig
    ) {
      throw new Error("init not called");
    }

    const marinadeProgram = this.marinade.marinadeFinanceProgram.programAddress;

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.extractToTreasury>["accounts"]
    >[0];

    const liqPoolSolLegPda = await this.marinadeState.solLeg();

    const [epochReportAccount] = findEpochReportAccount(this.config);

    const accounts: Accounts = {
      state: this.env.state,
      marinadeState: this.marinadeState.marinadeStateAddress,
      blazeState: this.blazeState.pool,
      msolMint: this.marinadeState.mSolMintAddress,
      gsolMint: this.config.gsolMint,
      bsolMint: this.blazeState.bsolMint,
      liqPoolMint: this.marinadeState.lpMint.address,
      liqPoolSolLegPda,
      liqPoolMsolLeg: this.marinadeState.mSolLeg,
      liqPoolTokenAccount: this.tokenConfig.liqPoolTokenAccount,
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.tokenConfig.msolTokenAccount,
      getMsolFromAuthority: this.tokenConfig.msolTokenAccountAuthority[0],
      getBsolFrom: this.tokenConfig.bsolTokenAccount,
      getBsolFromAuthority: this.tokenConfig.bsolTokenAccountAuthority[0],
      epochReportAccount,
      treasury: this.config.treasury,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      marinadeProgram,
    };

    return this.program.methods
      .extractToTreasury()
      .accounts(accounts)
      .instruction();
  }

  public async extractYield(): Promise<string> {
    const instruction = await this.extractYieldIx();
    const transaction = new Transaction().add(instruction);
    transaction.feePayer = this.staker;
    // const res = await this.provider.connection.simulateTransaction(transaction);
    // console.log(res)

    // throw new Error("Disable");
    return this.sendAndConfirmTransaction(transaction);
  }

  public calculateWithdrawalFee(
    withdrawalLamports: BN,
    details: Details
  ): WithdrawalFees {
    // Calculate how much can be withdrawn from the lp (without fee)
    const lpSolShare = details.lpDetails.lpSolShare;
    const preferredMinLiqPoolValue = new BN(details.balances.gsolSupply.amount)
      .muln(DEFAULT_LP_MIN_PROPORTION)
      .divn(100);
    const postUnstakeLpSolValue = new BN(lpSolShare).sub(withdrawalLamports);

    // Calculate how much will be withdrawn through liquid unstaking (with fee)
    const amountBeingLiquidUnstaked = withdrawalLamports.sub(lpSolShare);

    // Determine if a rebalance will occur (if the lp value is too low)
    // This will incur a cost due to the unstake ticket rent
    const amountToOrderUnstake = new BN(preferredMinLiqPoolValue).sub(
      postUnstakeLpSolValue
    );
    const rentForOrderUnstakeTicket = amountToOrderUnstake.gt(ZERO)
      ? MARINADE_TICKET_RENT
      : 0;

    this.log("withdrawal lamports: ", withdrawalLamports.toString());
    this.log("lp sol share: ", lpSolShare.toString());
    this.log("preferred min lp value: ", preferredMinLiqPoolValue.toString());
    this.log("post unstake lp sol value: ", postUnstakeLpSolValue.toString());
    this.log(
      "amount being liquid unstaked: ",
      amountBeingLiquidUnstaked.toString()
    );
    this.log("amount to order unstake: ", amountToOrderUnstake.toString());
    this.log("rent for order unstake: ", rentForOrderUnstakeTicket.toString());

    const ticketFee = rentForOrderUnstakeTicket;
    let totalFee =
      rentForOrderUnstakeTicket > 0
        ? new BN(rentForOrderUnstakeTicket + 2 * NETWORK_FEE)
        : ZERO;

    this.log("base fee for order unstake: ", totalFee.toString());

    if (amountBeingLiquidUnstaked.lte(ZERO)) {
      return {
        liquidUnstakeFee: ZERO,
        ticketFee,
        totalFee,
      };
    }

    let marinadeUnstake: BN;

    const msolValue = details.mpDetails.msolValue;
    const bsolValue = details.bpDetails.bsolValue;

    if (msolValue >= bsolValue) {
      marinadeUnstake =
        msolValue > amountBeingLiquidUnstaked
          ? amountBeingLiquidUnstaked
          : msolValue;
    } else {
      marinadeUnstake =
        bsolValue > amountBeingLiquidUnstaked
          ? new BN(0)
          : amountBeingLiquidUnstaked.sub(bsolValue);
    }

    const blazeUnstake = amountBeingLiquidUnstaked.sub(marinadeUnstake);
    const blazeUnstakeFee = blazeUnstake
      .mul(details.bpDetails.solWithdrawalFee.numerator)
      .div(details.bpDetails.solWithdrawalFee.denominator);

    const marinadeUnstakeFee = marinadeUnstake.muln(3).divn(1000);
    const liquidUnstakeFee = blazeUnstakeFee.add(marinadeUnstakeFee);

    totalFee = totalFee.add(liquidUnstakeFee);

    this.log({
      withdrawalLamports: withdrawalLamports.toString(),
      lpSolShare: lpSolShare.toString(),
      amountBeingLiquidUnstaked: amountBeingLiquidUnstaked.toString(),
      marinadeUnstake: marinadeUnstake.toString(),
      blazeUnstake: blazeUnstake.toString(),
      marinadeUnstakeFee: marinadeUnstakeFee.toString(),
      blazeUnstakeFee: blazeUnstakeFee.toString(),
      liquidUnstakeFee: liquidUnstakeFee.toString(),
      msolValue: msolValue.toString(),
      bsolValue: bsolValue.toString(),
      totalFee: totalFee.toString(),
    });

    return {
      liquidUnstakeFee,
      ticketFee,
      totalFee,
    };
  }

  public async details(): Promise<Details> {
    if (
      !this.marinadeState ||
      !this.stakerGSolTokenAccount ||
      !this.tokenConfig ||
      !this.config
    )
      throw new Error("init not called");

    const currentEpochPromise = this.provider.connection.getEpochInfo();

    const lpMintInfoPromise = this.marinadeState.lpMint.mintInfo();
    const lpMsolBalancePromise =
      this.provider.connection.getTokenAccountBalance(
        this.marinadeState.mSolLeg
      );

    const solLeg = await this.marinadeState.solLeg();
    const solLegBalancePromise = this.provider.connection.getBalance(solLeg);

    const balancesPromise = this.balance();

    const lockAccountPromise = await this.getLockAccount();

    const impactNFTPromise = await getImpactNFT(
      this.config,
      this.staker,
      this.provider
    );

    const [
      currentEpoch,
      lpMintInfo,
      lpSolLegBalance,
      lpMsolBalance,
      balances,
      lockAccountDetails,
      impactNFT,
    ] = await Promise.all([
      currentEpochPromise,
      lpMintInfoPromise,
      solLegBalancePromise,
      lpMsolBalancePromise,
      balancesPromise,
      lockAccountPromise,
      impactNFTPromise,
    ]);

    const availableLiqPoolSolLegBalance = new BN(lpSolLegBalance).sub(
      this.marinadeState.state.rentExemptForTokenAcc
    );
    const lpMsolShare = proportionalBN(
      new BN(balances.liqPoolBalance.amount),
      new BN(lpMsolBalance.value.amount),
      new BN(lpMintInfo.supply.toString())
    );
    const lpSolShare = proportionalBN(
      new BN(balances.liqPoolBalance.amount),
      availableLiqPoolSolLegBalance,
      new BN(lpMintInfo.supply.toString())
    );
    const solValueOlpMSolShare = this.computeLamportsFromMSol(
      lpMsolShare,
      this.marinadeState
    );

    const lpSolValue = lpSolShare.add(solValueOlpMSolShare);

    const solValueOfMSol = this.computeLamportsFromMSol(
      new BN(balances.msolBalance.amount),
      this.marinadeState
    );

    const mpDetails = {
      msolPrice: this.marinadeState.mSolPrice,
      msolValue: solValueOfMSol,
      stakeDelta: this.marinadeState.stakeDelta().toNumber(),
    };

    const lpDetails = {
      mintAddress: this.marinadeState.lpMint.address.toBase58(),
      supply: lpMintInfo.supply,
      mintAuthority: lpMintInfo.mintAuthority?.toBase58(),
      decimals: lpMintInfo.decimals,
      lpSolShare, // proportion of SOL deposited in the LP
      lpMsolShare,
      lpSolValue, // total SOL value of the LP tokens held by the sunrise instance
      msolLeg: this.marinadeState.mSolLeg.toBase58(),
    };

    const { account: epochReport } = await getEpochReportAccount(
      this.config,
      this.program
    );

    const stakePoolInfo = await getStakePoolAccount(
      this.provider.connection,
      this.env.blaze.pool
    );
    const [bsolPrice, bsolValue] = this.computeLamportsFromBSol(
      new BN(balances.bsolBalance.amount),
      stakePoolInfo
    );

    const bpDetails = {
      pool: this.env.blaze.pool.toString(),
      bsolPrice,
      bsolValue,
      solWithdrawalFee: {
        numerator: stakePoolInfo.solWithdrawalFee.numerator,
        denominator: stakePoolInfo.solWithdrawalFee.denominator,
      },
    };

    const lockDetails: Details["lockDetails"] =
      lockAccountDetails.lockAccount &&
      lockAccountDetails.tokenAccount &&
      lockAccountDetails.lockAccount.startEpoch &&
      lockAccountDetails.lockAccount.updatedToEpoch
        ? {
            lockAccount: lockAccountDetails.lockAccountAddress,
            lockTokenAccount: lockAccountDetails.tokenAccountAddress,
            startEpoch: lockAccountDetails.lockAccount.startEpoch,
            updatedToEpoch: lockAccountDetails.lockAccount.updatedToEpoch,
            amountLocked: new BN(`${lockAccountDetails.tokenAccount.amount}`),
            yield: lockAccountDetails.lockAccount.yieldAccruedByOwner,
            currentLevel: lockAccountDetails.currentLevel,
            yieldToNextLevel: lockAccountDetails.yieldToNextLevel,
          }
        : undefined;

    const nftSummary = this.config.impactNFTStateAddress
      ? {
          stateAddress: this.config.impactNFTStateAddress,
          mintAuthority: findImpactNFTMintAuthority(this.config)[0],
          mint: impactNFT.mint,
          tokenAccount: impactNFT.tokenAccount,
        }
      : undefined;
    const impactNFTDetails: Details["impactNFTDetails"] = impactNFT?.exists
      ? nftSummary
      : undefined;

    const detailsWithoutYield: Omit<Details, "extractableYield"> = {
      staker: this.staker.toBase58(),
      balances,
      currentEpoch,
      epochReport: epochReport ?? EMPTY_EPOCH_REPORT,
      stakerGSolTokenAccount: this.stakerGSolTokenAccount.toBase58(),
      sunriseStakeConfig: {
        gsolMint: this.config.gsolMint.toBase58(),
        programId: this.config.programId.toBase58(),
        stateAddress: this.config.stateAddress.toBase58(),
        treasury: this.config.treasury.toBase58(),
        msolTokenAccount: this.tokenConfig.msolTokenAccount.toBase58(),
        msolTokenAccountAuthority: this.tokenConfig.msolTokenAccountAuthority[0].toBase58(),
      },
      marinadeFinanceProgramId:
        this.marinadeState.marinadeFinanceProgramId.toBase58(),
      marinadeStateAddress: this.marinadeState.marinadeStateAddress.toBase58(),
      mpDetails,
      lpDetails,
      bpDetails,
      lockDetails,
      impactNFTDetails,
    };

    const extractableYield =
      this.calculateExtractableYield(detailsWithoutYield);

    return {
      ...detailsWithoutYield,
      extractableYield,
    };
  }

  private computeLamportsFromMSol(
    msolAmount: BN,
    marinadeState: MarinadeState
  ): BN {
    const totalCoolingDown =
      marinadeState.state.stakeSystem.delayedUnstakeCoolingDown.add(
        marinadeState.state.emergencyCoolingDown
      );
    const totalLamportsUnderControl =
      marinadeState.state.validatorSystem.totalActiveBalance
        .add(totalCoolingDown)
        .add(marinadeState.state.availableReserveBalance);
    const totalVirtualStakedLamports = totalLamportsUnderControl.sub(
      marinadeState.state.circulatingTicketBalance
    );

    return proportionalBN(
      msolAmount,
      totalVirtualStakedLamports,
      marinadeState.state.msolSupply
    );
  }

  private computeLamportsFromBSol(
    bsolAmount: BN,
    stakePoolInfo: StakePool
  ): [number, BN] {
    const bsolPrice =
      Number(stakePoolInfo.totalLamports) /
      Number(stakePoolInfo.poolTokenSupply);
    const solValue = Math.floor(Number(bsolAmount) * bsolPrice);

    return [bsolPrice, new BN(solValue)];
  }

  private readonly getRegisterStateAccounts = async (
    treasury: PublicKey,
    gsolMint: PublicKey,
    options: Options = {}
    // TODO get these types from the IDL
  ): Promise<{ accounts: any; parameters: any }> => {
    const config = {
      gsolMint,
      programId: this.program.programId,
      stateAddress: this.env.state,
      updateAuthority: this.provider.publicKey,
      treasury,
      liqPoolProportion: DEFAULT_LP_PROPORTION,
      liqPoolMinProportion: DEFAULT_LP_MIN_PROPORTION,
      impactNFTStateAddress: this.env.impactNFT.state,
      options,
    };
    const marinadeConfig = new MarinadeConfig({
      connection: this.provider.connection,
    });

    const marinadeState = await new Marinade(marinadeConfig).getMarinadeState();

    const tokenAccounts = await this.getTokenConfig(config);

    const [msolAuthority, msolAuthorityBump] =
      tokenAccounts.msolTokenAccountAuthority;
    const [bsolAuthority, bsolAuthorityBump] =
      tokenAccounts.bsolTokenAccountAuthority;
    const gsolMintAuthorityBump = tokenAccounts.gsolMintAuthority[1];

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.registerState>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.env.state,
      payer: this.provider.publicKey,
      mint: gsolMint,
      msolMint: marinadeState.mSolMintAddress,
      bsolMint: this.env.blaze.bsolMint,
      msolTokenAccountAuthority: msolAuthority,
      msolTokenAccount: tokenAccounts.msolTokenAccount,
      liqPoolMint: marinadeState.lpMint.address,
      liqPoolTokenAccount: tokenAccounts.liqPoolTokenAccount,
      bsolTokenAccountAuthority: bsolAuthority,
      bsolTokenAccount: tokenAccounts.bsolTokenAccount,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    };

    const parameters = {
      marinadeState: marinadeConfig.marinadeStateAddress,
      blazeState: this.env.blaze.pool,
      updateAuthority: this.provider.publicKey,
      treasury,
      gsolMintAuthorityBump,
      msolAuthorityBump,
      bsolAuthorityBump,
      liqPoolProportion: DEFAULT_LP_PROPORTION,
      liqPoolMinProportion: DEFAULT_LP_MIN_PROPORTION,
    };

    return { accounts, parameters };
  };

  private calculateExtractableYield({
    balances,
    mpDetails,
    lpDetails,
    epochReport,
    bpDetails,
  }: Omit<Details, "extractableYield">): BN {
    if (!this.marinadeState)
      throw new Error("init not called");

    // deposited in Stake Pool
    const solValueOfMSol = mpDetails.msolValue;
    const solValueOfBSol = bpDetails.bsolValue;

    // deposited in Liquidity Pool
    const solValueOfLP = lpDetails.lpSolValue;

    const gsolSupply = new BN(balances.gsolSupply.amount);

    const totalSolValueStaked = solValueOfMSol
      .add(solValueOfLP)
      .add(solValueOfBSol);

    const inflightTotal = epochReport.totalOrderedLamports;

    const extractableSOLGross = totalSolValueStaked
      .add(inflightTotal)
      .sub(gsolSupply);

    const fee = extractableSOLGross.muln(3).divn(1000);

    return extractableSOLGross.sub(fee);
  }

  public static async register(
    treasury: PublicKey,
    gsolMint: Keypair,
    env: Omit<EnvironmentConfig, "state">,
    options: Options = {}
  ): Promise<SunriseStakeClient> {
    const sunriseStakeState = Keypair.generate();
    const client = new SunriseStakeClient(
      setUpAnchor(),
      {
        ...env,
        state: sunriseStakeState.publicKey,
      },
      options
    );

    const { accounts, parameters } = await client.getRegisterStateAccounts(
      treasury,
      gsolMint.publicKey,
      options
    );

    await client.program.methods
      .registerState(parameters)
      .accounts(accounts)
      .signers([gsolMint, sunriseStakeState])
      .rpc()
      .then(confirm(client.provider.connection));

    console.log("before init env", client.env);
    await client.init();

    await client.initEpochReport().then(confirm(client.provider.connection));

    return client;
  }

  public async update({
    newTreasury,
    newUpdateAuthority,
    newliqPoolProportion,
    newliqPoolMinProportion,
  }: {
    newTreasury?: PublicKey;
    newUpdateAuthority?: PublicKey;
    newliqPoolProportion?: number;
    newliqPoolMinProportion?: number;
  }): Promise<void> {
    if (!this.config) throw new Error("init not called");

    const { accounts, parameters } = await this.getRegisterStateAccounts(
      newTreasury ?? this.config.treasury,
      this.config.gsolMint
    );

    await this.program.methods
      .updateState({
        ...parameters,
        updateAuthority: newUpdateAuthority ?? parameters.updateAuthority,
        liqPoolProportion: newliqPoolProportion ?? parameters.liqPoolProportion,
        liqPoolMinProportion:
          newliqPoolMinProportion ?? parameters.liqPoolMinProportion,
      })
      .accounts(accounts)
      .rpc()
      .then(confirm(this.provider.connection));

    await this.init();
  }

  public async balance(): Promise<Balance> {
    if (
      !this.config ||
      !this.tokenConfig ||
      !this.marinadeState || 
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");
      
    const gsolBalancePromise = this.provider.connection
      .getTokenAccountBalance(this.stakerGSolTokenAccount)
      .catch((e) => {
        // Treat a missing account as zero balance
        if ((e.message as string).endsWith("could not find account")) {
          return ZERO_BALANCE;
        }
        throw e;
      });

      const gsolSupplyPromise = this.provider.connection.getTokenSupply(
        this.config.gsolMint
      );
  
    const msolLamportsBalancePromise =
      this.provider.connection.getTokenAccountBalance(
      this.tokenConfig.msolTokenAccount
    );
    const bsolLamportsBalancePromise =
      this.provider.connection.getTokenAccountBalance(
      this.tokenConfig.bsolTokenAccount
    );
    const liqPoolBalancePromise =
      this.provider.connection.getTokenAccountBalance(
      this.tokenConfig.liqPoolTokenAccount
    );
    const treasuryBalancePromise = this.provider.connection.getBalance(
      this.config.treasury
    );
    const holdingAccountBalancePromise = this.provider.connection.getBalance(
      this.env.holdingAccount
    );
  
    const [
      gsolBalance,
      gsolSupply,
      msolLamportsBalance,
      lpBalance,
      treasuryBalance,
      bsolLamportsBalance,
      holdingAccountBalance,
    ] = await Promise.all([
      gsolBalancePromise,
      gsolSupplyPromise,
      msolLamportsBalancePromise,
      liqPoolBalancePromise,
      treasuryBalancePromise,
      bsolLamportsBalancePromise,
      holdingAccountBalancePromise,
    ]);
  
    return {
      gsolBalance: gsolBalance.value,
      gsolSupply: gsolSupply.value,
      msolBalance: msolLamportsBalance.value,
      msolPrice: this.marinadeState.mSolPrice,
      liqPoolBalance: lpBalance.value,
      treasuryBalance,
      bsolBalance: bsolLamportsBalance.value,
      holdingAccountBalance,
    };
  }

  public async lockGSol(lamports: BN): Promise<Transaction[]> {
    if (
      !this.stakerGSolTokenAccount ||
      !this.config ||
      !this.marinade ||
      !this.marinadeState ||
      !this.lockClient
    )
      throw new Error("init not called");

    // Before locking gsol, the epoch report account must be updated to the current epoch,
    // via a recoverTickets instruction.
    // The first person to lock this epoch will trigger this update before
    // updating their lock account.
    // However, combining a recoverTickets instruction and a lockGsol instruction into a
    // single transaction results in a transaction that is too large.
    // Therefore, we split the transaction into two parts
    const transactions: Transaction[] = [];

    const recoverInstruction = await this.recoverTickets();

    if (recoverInstruction) {
      transactions.push(new Transaction().add(recoverInstruction));
    }

    const lockTx = await this.lockClient.lockGSol(
      this.stakerGSolTokenAccount,
      this.env.impactNFT,
      lamports
    );
    transactions.push(lockTx);

    return transactions;
  }

  public async updateLockAccount(): Promise<Transaction[]> {
    if (!this.config || !this.lockClient) throw new Error("init not called");

    // Before updating a lock account, the epoch report account must be updated to the current epoch,
    // via a recoverTickets instruction.
    // The first person to update their lock account this epoch will trigger this update before
    // updating their lock account.
    // However, combining a recoverTickets instruction and an updateLockAccount instruction into a
    // single transaction results in a transaction that is too large.
    // Therefore, we split the transaction into two parts
    const transactions: Transaction[] = [];

    const currentEpoch = await this.provider.connection.getEpochInfo();

    // ensure all rebalance tickets are recovered before updating the yield on the lock account
    // otherwise the calculations will be incorrect
    // this will also update the epoch report to the current epoch if not already updated
    const recoverInstruction = await this.recoverTickets();

    if (recoverInstruction) {
      await this.sendAndConfirmTransaction(
        new Transaction().add(recoverInstruction)
      );
    }

    const { lockAccount } = await this.getLockAccount();

    if (!lockAccount) throw new Error("lock account not found");
    if (!lockAccount.startEpoch || !lockAccount.updatedToEpoch)
      throw new Error("lock account has not been locked?");

    // only update if the lock account has not been updated this epoch
    if (lockAccount.updatedToEpoch?.toNumber() < currentEpoch.epoch) {
      const updateTx = await this.lockClient.updateLockAccount();
      transactions.push(updateTx);
    }

    return transactions;
  }

  public async unlockGSol(): Promise<Transaction[]> {
    if (!this.lockClient) throw new Error("init not called");
    if (!this.stakerGSolTokenAccount) throw new Error("No stake found");

    // Update a lock account if it has not been updated this epoch
    const transactions = await this.updateLockAccount();

    // updateLockAccount returns an array of transactions.
    // Theoretically, the unlock transaction could be combined with the update transaction
    // TODO - combine the unlock transaction with the update transaction if possible
    const unlockTx = await this.lockClient.unlockGSol(
      this.stakerGSolTokenAccount
    );

    transactions.push(unlockTx);

    return transactions;
  }

  public async getLockAccount(): Promise<LockAccountSummary> {
    if (!this.lockClient) throw new Error("init not called");

    return {
      lockAccount: this.lockClient.lockAccount,
      lockAccountAddress: this.lockClient.lockAccountAddress,
      tokenAccount: this.lockClient.lockTokenAccount,
      tokenAccountAddress: this.lockClient.lockTokenAccountAddress,
      currentLevel: this.lockClient.getCurrentLevel(),
      yieldToNextLevel: this.lockClient.getYieldToNextLevel(),
    };
  }

  public static async get(
    provider: AnchorProvider,
    stage: keyof typeof Environment,
    options: Options = {}
  ): Promise<SunriseStakeClient> {
    const client = new SunriseStakeClient(
      provider,
      Environment[stage],
      options
    );
    await client.init();
    return client;
  }
}
