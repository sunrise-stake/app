import { IDL, type SunriseStake } from "./types/sunrise_stake.js";
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
  type SunriseStakeConfig,
  ZERO,
  ZERO_BALANCE,
  toSol,
  findImpactNFTMintAuthority,
  getImpactNFT,
  zip,
} from "./util.js";
import {
  Marinade,
  MarinadeConfig,
  type MarinadeState,
} from "@sunrisestake/marinade-ts-sdk";
import {
  type Balance,
  type Details,
  type WithdrawalFees,
} from "./types/Details.js";
import {
  type SunriseTicketAccountFields,
  type TicketAccount,
} from "./types/TicketAccount.js";
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
} from "./constants.js";
import {
  deposit,
  depositStakeAccount,
  liquidUnstake,
  triggerRebalance,
  getEpochReportAccount,
} from "./marinade.js";
import { blazeDeposit, blazeWithdrawSol, blazeWithdrawStake } from "./blaze.js";
import { type BlazeState } from "./types/Solblaze.js";
import { getStakePoolAccount, type StakePool } from "./decodeStakePool.js";
import { type EpochReportAccount } from "./types/EpochReportAccount.js";
import { LockClient, type LockAccountSummary } from "./lock.js";
import BN from "bn.js";

// export getStakePoolAccount
export { getStakePoolAccount, type StakePool };

// export all types
export * from "./types/sunrise_stake.js";
export * from "./types/Details.js";
export * from "./types/TicketAccount.js";
export * from "./types/EpochReportAccount.js";
export * from "./types/Solblaze.js";

// export all constants
export * from "./constants.js";

export { toSol, findImpactNFTMintAuthority, ZERO_BALANCE } from "./util.js";

export class SunriseStakeClient {
  readonly program: Program<SunriseStake>;
  config: SunriseStakeConfig | undefined;

  // TODO make private once all functions are moved in here
  marinade: Marinade | undefined;
  marinadeState: MarinadeState | undefined;

  // TODO move to config?
  readonly staker: PublicKey;
  stakerGSolTokenAccount: PublicKey | undefined;

  msolTokenAccountAuthority: PublicKey | undefined;
  msolTokenAccount: PublicKey | undefined;

  bsolTokenAccountAuthority: PublicKey | undefined;
  bsolTokenAccount: PublicKey | undefined;

  blazeState: BlazeState | undefined;

  liqPoolTokenAccount: PublicKey | undefined;
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

  /**
   * Refresh the client's internal state
   */
  public async refresh(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    const sunriseStakeState = await this.program.account.state.fetch(
      this.env.state
    );

    const stakePoolInfo = await getStakePoolAccount(
      this.provider.connection,
      this.env.blaze.pool
    );

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

    this.stakerGSolTokenAccount = PublicKey.findProgramAddressSync(
      [
        this.staker.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        sunriseStakeState.gsolMint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
    const [gsolMintAuthority] = findGSolMintAuthority(this.config);
    this.msolTokenAccountAuthority = findMSolTokenAccountAuthority(
      this.config
    )[0];
    this.bsolTokenAccountAuthority = findBSolTokenAccountAuthority(
      this.config
    )[0];

    const marinadeConfig = new MarinadeConfig({
      connection: this.provider.connection,
      publicKey: this.provider.publicKey,
      proxyStateAddress: this.env.state,
      proxySolMintAuthority: gsolMintAuthority,
      proxySolMintAddress: this.config.gsolMint,
      msolTokenAccountAuthority: this.msolTokenAccountAuthority,
      proxyTreasury: this.config.treasury,
    });
    this.marinade = new Marinade(marinadeConfig);
    this.marinadeState = await this.marinade.getMarinadeState();
    this.msolTokenAccount = await utils.token.associatedAddress({
      mint: this.marinadeState.mSolMintAddress,
      owner: this.msolTokenAccountAuthority,
    });
    this.liqPoolTokenAccount = await utils.token.associatedAddress({
      mint: this.marinadeState.lpMint.address,
      owner: this.msolTokenAccountAuthority,
    });

    const [withdrawAuthority] = PublicKey.findProgramAddressSync(
      [this.env.blaze.pool.toBuffer(), Buffer.from("withdraw")],
      STAKE_POOL_PROGRAM_ID
    );

    const [depositAuthority] = PublicKey.findProgramAddressSync(
      [this.env.blaze.pool.toBuffer(), Buffer.from("deposit")],
      STAKE_POOL_PROGRAM_ID
    );

    this.blazeState = {
      pool: this.env.blaze.pool,
      bsolMint: stakePoolInfo.poolMint,
      validatorList: stakePoolInfo.validatorList,
      reserveAccount: stakePoolInfo.reserveStake,
      managerAccount: stakePoolInfo.manager,
      feesDepot: stakePoolInfo.managerFeeAccount,
      withdrawAuthority,
      depositAuthority,
    };

    this.bsolTokenAccount = await utils.token.associatedAddress({
      mint: stakePoolInfo.poolMint,
      owner: this.bsolTokenAccountAuthority,
    });

    this.lockClient = await LockClient.build(
      this.config,
      this.program,
      this.staker
    );
  }

  /**
   * Utility function for sending an transaction and waiting for it to confirm.
   * @param transaction
   * @param signers
   * @param opts
   */
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

  /**
   * Create a new GSol token account for the staker
   * @param account
   * @param authority
   */
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

  /**
   * Deposit GSol into the staker's GSol token account
   * @param lamports
   * @param recipient The recipient of the gSOL. If not provided, the current staker will be used.
   */
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

  /**
   * Deposit directly to Marinade
   * @deprecated - use makeBalancedDeposit instead
   * @param lamports
   * @param recipient The recipient of the gSOL. If not provided, the current staker will be used.
   */
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

  /**
   * Deposit directly to Solblaze
   * @deprecated - use makeBalancedDeposit instead
   * @param lamports
   * @param recipient The recipient of the gSOL. If not provided, the current staker will be used.
   */
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

  /**
   * Deposit an existing SPL Stake account
   * @param stakeAccountAddress
   */
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

  /**
   * Withdraw GSol from the staker's GSol token account.
   * Note - this currently uses Marinade only.
   * @param lamports
   */
  public async unstake(lamports: BN): Promise<Transaction> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
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

  /**
   * Permissionless admin function.
   *
   * Recover delayed unstake tickets from rebalances in the previous epoch, if necessary
   * Note, even if there are no tickets to recover, if the epoch report references the previous epoch
   * we call this instruction anyway as part of triggerRebalance, to update the epoch.
   */
  async recoverTickets(): Promise<TransactionInstruction | null> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
      !this.bsolTokenAccount ||
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
      liqPoolTokenAccount: this.liqPoolTokenAccount,
      reservePda: await this.marinadeState.reserveAddress(),
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.msolTokenAccount,
      getMsolFromAuthority: this.msolTokenAccountAuthority,
      getBsolFrom: this.bsolTokenAccount,
      getBsolFromAuthority: this.bsolTokenAccountAuthority,
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
   * Permissionless admin function.
   *
   * Update the epoch report account to the current epoch.
   * The epoch report account is used to track the total yield earned by the protocol
   * as well as the amount of in-flight delayed unstake tickets created through pool rebalancing.
   */
  async updateEpochReport(): Promise<void> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
      !this.bsolTokenAccount ||
      !this.stakerGSolTokenAccount ||
      !this.blazeState
    )
      throw new Error("init not called");

    const marinadeProgram = this.marinade.marinadeFinanceProgram.programAddress;

    // check the most recent epoch report account
    // if it is not for the current epoch, then we may need to recover tickets
    const { address: epochReportAccountAddress, account: epochReport } =
      await getEpochReportAccount(this.config, this.program);

    if (!epochReport) {
      // no epoch report account found at all - something went wrong
      throw new Error("No epoch report account found during recoverTickets");
    }

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.updateEpochReport>["accounts"]
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
      liqPoolTokenAccount: this.liqPoolTokenAccount,
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.msolTokenAccount,
      getMsolFromAuthority: this.msolTokenAccountAuthority,
      getBsolFrom: this.bsolTokenAccount,
      getBsolFromAuthority: this.bsolTokenAccountAuthority,
      epochReportAccount: epochReportAccountAddress,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: SYSVAR_CLOCK_PUBKEY,
      marinadeProgram,
    };

    await this.program.methods
      .updateEpochReport()
      .accounts(accounts)
      .rpc()
      .then(confirm(this.provider.connection));
  }

  /**
   * Permissionless admin function.
   *
   * Trigger a rebalance without doing anything else.
   *
   * A rebalance is necessary when the amount of funds in one of the pools is too low.
   * This happens when too many people withdraw from the liquidity pool at once.
   * Rebalancing moves a proportion of the stake pool into the liquidity pool, using a delayed unstake.
   * This must then be redeemed in the next epoch by making a recover-tickets call.
   */
  public async triggerRebalance(): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
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

  /**
   * Print a detailed report of the current state of the protocol.
   */
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

  /**
   * Trigger a delayed unstake of the given amount of SOL.
   * This creates a ticket, which can be redeemed for SOL in the next epoch.
   * Note - it currently works only with marinade.
   * @param lamports
   */
  public async orderUnstake(lamports: BN): Promise<[Transaction, Keypair[]]> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount
    )
      throw new Error("init not called");

    const { transaction, newTicketAccount, proxyTicketAccount } =
      await this.marinade.orderUnstake(lamports, this.msolTokenAccount);

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

  /**
   * Find all delayed-unstake tickets for the current user
   */
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

  /**
   * Redeem a delayed-unstake ticket and send the SOL to the given address.
   * @param ticketAccount
   */
  public async claimUnstakeTicket(
    ticketAccount: TicketAccount
  ): Promise<Transaction> {
    if (!this.marinade || !this.marinadeState)
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
      msolAuthority: this.msolTokenAccountAuthority,
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

  /**
   * Immediately withdraw the given amount of SOL from the Solblaze stake pool.
   * @param amount
   */
  public async withdrawFromBlaze(amount: BN): Promise<string> {
    if (
      !this.blazeState ||
      !this.config ||
      !this.stakerGSolTokenAccount ||
      !this.bsolTokenAccount
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

  /**
   * Withdraw the given amount of SOL from the Solblaze stake pool into a stake account
   * @param newStakeAccount
   * @param amount
   */
  public async withdrawStakeFromBlaze(
    newStakeAccount: PublicKey,
    amount: BN
  ): Promise<string> {
    if (
      !this.blazeState ||
      !this.config ||
      !this.stakerGSolTokenAccount ||
      !this.bsolTokenAccount
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

  /**
   * Create a new EpochReport account for a sunrise state instance.
   * This should be done only once per state, and must be signed by the update authority
   */
  public async initEpochReport(): Promise<string> {
    if (
      !this.marinadeState ||
      !this.blazeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
      !this.msolTokenAccountAuthority ||
      !this.liqPoolTokenAccount
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
      liqPoolTokenAccount: this.liqPoolTokenAccount,
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.msolTokenAccount,
      getMsolFromAuthority: this.msolTokenAccountAuthority,
      getBsolFrom: this.bsolTokenAccount,
      getBsolFromAuthority: this.bsolTokenAccountAuthority,
      epochReportAccount: epochReportAccountAddress,
      treasury: this.config.treasury,
      systemProgram: SystemProgram.programId,
    };

    return this.program.methods
      .initEpochReport(new BN(0))
      .accounts(accounts)
      .rpc();
  }

  /**
   * Get the EpochReport account for this sunrise state instance
   * The EpochReport account contains running totals of the state's accrued yield,
   * and is updated regularly
   */
  public async getEpochReport(): Promise<EpochReportAccount> {
    if (!this.config) {
      throw new Error("init not called");
    }

    const { account } = await getEpochReportAccount(this.config, this.program);

    // The update authority must create the epoch report account for this sunrise state instance
    if (!account) throw new Error("Epoch report account not found");

    return account;
  }

  /**
   * Create an instruction that extracts yield from the sunrise protocol and sends it to the designated
   * yield account.
   *
   * This is a permissionless crank operation that can be called by anyone.
   */
  public async extractYieldIx(): Promise<TransactionInstruction> {
    if (
      !this.marinadeState ||
      !this.blazeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
      !this.msolTokenAccountAuthority ||
      !this.liqPoolTokenAccount
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
      liqPoolTokenAccount: this.liqPoolTokenAccount,
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.msolTokenAccount,
      getMsolFromAuthority: this.msolTokenAccountAuthority,
      getBsolFrom: this.bsolTokenAccount,
      getBsolFromAuthority: this.bsolTokenAccountAuthority,
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

  /**
   * Creates and submits an extractYield transaction that extracts yield from the sunrise protocol and sends it to the designated
   * yield account.
   *
   * This is a permissionless crank operation that can be called by anyone.
   */
  public async extractYield(): Promise<string> {
    const instruction = await this.extractYieldIx();
    const transaction = new Transaction().add(instruction);
    transaction.feePayer = this.staker;
    return this.sendAndConfirmTransaction(transaction);
  }

  /**
   * Calculates the cost of withdrawing a given amount of lamports, given the current state of the pools
   * @param withdrawalLamports
   * @param details
   */
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

  /**
   * Returns an object containing the current state of the Sunrise protocol,
   * as well as balances and impact nft status for the user
   */
  public async details(): Promise<Details> {
    if (
      !this.marinadeState ||
      !this.stakerGSolTokenAccount ||
      !this.msolTokenAccount ||
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

    const lockAccountPromise = await this.getLockAccount(true);

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
            unrealizedYield: lockAccountDetails.unrealizedYield,
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
        msolTokenAccount: this.msolTokenAccount.toBase58(),
        msolTokenAccountAuthority: this.msolTokenAccountAuthority?.toBase58(),
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

    const [, gsolMintAuthorityBump] = findGSolMintAuthority(config);

    const [msolAuthority, msolAuthorityBump] =
      findMSolTokenAccountAuthority(config);
    const msolAssociatedTokenAccountAddress =
      await utils.token.associatedAddress({
        mint: marinadeState.mSolMintAddress,
        owner: msolAuthority,
      });
    // use the same token authority PDA for the msol token account
    // and the liquidity pool token account for convenience
    const liqPoolAssociatedTokenAccountAddress =
      await utils.token.associatedAddress({
        mint: marinadeState.lpMint.address,
        owner: msolAuthority,
      });

    const [bsolAuthority, bsolAuthorityBump] =
      findBSolTokenAccountAuthority(config);
    const bsolTokenAccountAddress = await utils.token.associatedAddress({
      mint: this.env.blaze.bsolMint,
      owner: bsolAuthority,
    });

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
      msolTokenAccount: msolAssociatedTokenAccountAddress,
      liqPoolMint: marinadeState.lpMint.address,
      liqPoolTokenAccount: liqPoolAssociatedTokenAccountAddress,
      bsolTokenAccountAuthority: bsolAuthority,
      bsolTokenAccount: bsolTokenAccountAddress,
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
    if (!this.marinadeState || !this.msolTokenAccount)
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

  /**
   * Create a new sunrise stake instance.
   * This sets the Anchor-specified wallet as the updateAuthority of this instance.
   * It also creates a new "gsol" token - each instance of sunrise is associated with its own token
   * @param treasury
   * @param gsolMint
   * @param env
   * @param options
   */
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

    await client.init();

    await client.initEpochReport().then(confirm(client.provider.connection));

    return client;
  }

  /**
   * Updates the configuration of the sunrise state instance. This can be used to set a new yield account,
   * or a new update authority, or set a new liquidity pool proportion.
   * @param newTreasury
   * @param newUpdateAuthority
   * @param newliqPoolProportion
   * @param newliqPoolMinProportion
   */
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

  /**
   * Get the user's current balance, and the current gsol supply
   */
  public async balance(): Promise<Balance> {
    if (!this.marinadeState || !this.stakerGSolTokenAccount || !this.config)
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

    const msolTokenAccountAuthority = findMSolTokenAccountAuthority(
      this.config
    )[0];
    const msolAssociatedTokenAccountAddress =
      await utils.token.associatedAddress({
        mint: this.marinadeState.mSolMintAddress,
        owner: msolTokenAccountAuthority,
      });
    const msolLamportsBalancePromise =
      this.provider.connection.getTokenAccountBalance(
        msolAssociatedTokenAccountAddress
      );

    const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(
      this.config
    )[0];
    const bsolAssociatedTokenAccountAddress =
      await utils.token.associatedAddress({
        mint: this.env.blaze.bsolMint,
        owner: bsolTokenAccountAuthority,
      });
    const bsolLamportsBalancePromise =
      this.provider.connection.getTokenAccountBalance(
        bsolAssociatedTokenAccountAddress
      );

    // use the same token authority PDA for the msol token account
    // and the liquidity pool token account for convenience
    const liqPoolAssociatedTokenAccountAddress =
      await utils.token.associatedAddress({
        mint: this.marinadeState.lpMint.address,
        owner: msolTokenAccountAuthority,
      });

    const liqPoolBalancePromise =
      this.provider.connection.getTokenAccountBalance(
        liqPoolAssociatedTokenAccountAddress
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

  /**
   * Lock some staked gSOL in order to obtain an Impact NFT
   * @param lamports
   */
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

  /**
   * Update the account that records the yield proportion allocated to a user, by virtue of their
   * locked gSOL.
   */
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

  /**
   * Unlock a user's gSOL so that it can be unstaked
   */
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

  /**
   * Get a user's lock account, that records the yield proportion allocated to a user, by virtue of their
   * locked gSOL.
   * @param withRefresh
   */
  public async getLockAccount(
    withRefresh = false
  ): Promise<LockAccountSummary> {
    if (!this.lockClient) throw new Error("init not called");

    if (withRefresh) await this.lockClient.refresh();

    const updatedYieldAccrued = this.lockClient.lockAccount
      ? await this.lockClient.calculateUpdatedYieldAccrued()
      : null;

    const currentLevel = this.lockClient.getCurrentLevel();

    // TODO this is a little messy, as we are reversing a calculation that was already made in calculateUpdatedYieldAccrued
    const unrealizedYield = updatedYieldAccrued?.sub(
      this.lockClient.lockAccount?.yieldAccruedByOwner ?? ZERO
    );

    return {
      lockAccount: this.lockClient.lockAccount,
      lockAccountAddress: this.lockClient.lockAccountAddress,
      tokenAccount: this.lockClient.lockTokenAccount,
      tokenAccountAddress: this.lockClient.lockTokenAccountAddress,
      currentLevel,
      yieldToNextLevel: this.lockClient.getYieldToNextLevel(
        currentLevel?.index
      ),
      unrealizedYield: unrealizedYield ?? null,
    };
  }

  /**
   * Create an instance of the Sunrise Client.
   * @param provider
   * @param stage
   * @param options
   */
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
