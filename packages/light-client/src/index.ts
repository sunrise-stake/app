import { IDL, type SunriseStake } from "./types/sunrise_stake.js";
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
  findBSolTokenAccountAuthority,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  logKeys,
  type Options,
  PROGRAM_ID,
  proportionalBN,
  type SunriseStakeConfig,
  ZERO,
  ZERO_BALANCE,
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
  Environment,
  type EnvironmentConfig,
  MARINADE_TICKET_RENT,
  NETWORK_FEE,
  STAKE_POOL_PROGRAM_ID,
} from "./constants.js";
import {
  deposit
} from "./marinade.js";
import { blazeDeposit, blazeWithdrawSol, blazeWithdrawStake } from "./blaze.js";
import { type BlazeState } from "./types/Solblaze.js";
import { getStakePoolAccount, type StakePool } from "./decodeStakePool.js";
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

export { toSol, ZERO_BALANCE } from "./util.js";

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
