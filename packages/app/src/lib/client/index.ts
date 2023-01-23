import { SunriseStake, IDL } from "./types/sunrise_stake";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Program, utils } from "@project-serum/anchor";
import {
  ConfirmOptions,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  confirm,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  findBSolTokenAccountAuthority,
  SunriseStakeConfig,
  logKeys,
  Options,
  PROGRAM_ID,
  setUpAnchor,
  ZERO_BALANCE,
  Balance,
  proportionalBN,
  marinadeTargetReached,
} from "./util";
import {
  Marinade,
  MarinadeConfig,
  MarinadeState,
} from "@sunrisestake/marinade-ts-sdk";
import BN from "bn.js";
import { Details } from "./types/Details";
import {
  SunriseTicketAccountFields,
  TicketAccount,
} from "./types/TicketAccount";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  DEFAULT_LP_MIN_PROPORTION,
  DEFAULT_LP_PROPORTION,
  MARINADE_TICKET_RENT,
  NETWORK_FEE,
  SOLBLAZE_CONFIG,
  STAKE_POOL_PROGRAM_ID,
} from "../constants";
import {
  deposit,
  depositStakeAccount,
  liquidUnstake,
  orders,
  triggerRebalance,
} from "./marinade";
import {
  blazeDeposit,
  blazeDepositStake,
  blazeWithdrawSol,
  blazeWithdrawStake,
} from "./blaze";
import { ZERO } from "../util";
import { BlazeState } from "./types/Solblaze";
import { getStakePoolAccount, StakePool } from "./decode_stake_pool";

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

  private constructor(
    readonly provider: AnchorProvider,
    readonly stateAddress: PublicKey,
    readonly options: Options = {}
  ) {
    this.program = new Program<SunriseStake>(IDL, PROGRAM_ID, provider);
    this.staker = this.provider.publicKey;
  }

  private log(...args: any[]): void {
    Boolean(this.config?.options.verbose) && console.log(...args);
  }

  private async init(): Promise<void> {
    const sunriseStakeState = await this.program.account.state.fetch(
      this.stateAddress
    );

    this.config = {
      gsolMint: sunriseStakeState.gsolMint,
      treasury: sunriseStakeState.treasury,
      programId: this.program.programId,
      stateAddress: this.stateAddress,
      updateAuthority: sunriseStakeState.updateAuthority,
      liqPoolProportion: sunriseStakeState.liqPoolProportion,
      liqPoolMinProportion: sunriseStakeState.liqPoolMinProportion,
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
      proxyStateAddress: this.stateAddress,
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

    const stakePoolInfo = await getStakePoolAccount(
      this.provider.connection,
      SOLBLAZE_CONFIG.pool
    );
    const [withdrawAuthority] = PublicKey.findProgramAddressSync(
      [SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("withdraw")],
      STAKE_POOL_PROGRAM_ID
    );

    const [depositAuthority] = PublicKey.findProgramAddressSync(
      [SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("deposit")],
      STAKE_POOL_PROGRAM_ID
    );

    this.blazeState = {
      pool: SOLBLAZE_CONFIG.pool,
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

  private async sendAndConfirmTransaction(
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

  createGSolTokenAccountIx(): TransactionInstruction {
    if (!this.stakerGSolTokenAccount || !this.config)
      throw new Error("init not called");

    const createATAInstruction =
      createAssociatedTokenAccountIdempotentInstruction(
        this.provider.publicKey,
        this.stakerGSolTokenAccount,
        this.staker,
        this.config.gsolMint
      );

    return createATAInstruction;
  }

  public async makeDeposit(lamports: BN): Promise<string> {
    const details = await this.details();
    if (marinadeTargetReached(details, 75) === true) {
      console.log("Routing deposit to Solblaze");
      return this.depositToBlaze(lamports);
    }
    console.log("Depositing to marinade");
    return this.deposit(lamports);
  }

  public async deposit(lamports: BN): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      this.stakerGSolTokenAccount
    );

    const transaction = new Transaction();

    if (!gsolTokenAccount) {
      const createUserTokenAccount = await this.createGSolTokenAccountIx();
      transaction.add(createUserTokenAccount);
    }

    const depositTx = await deposit(
      this.config,
      this.program,
      this.marinade,
      this.marinadeState,
      this.config.stateAddress,
      this.provider.publicKey,
      this.stakerGSolTokenAccount,
      lamports
    );

    transaction.add(depositTx);
    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async depositToBlaze(lamports: BN): Promise<string> {
    if (!this.config || !this.stakerGSolTokenAccount || !this.blazeState)
      throw new Error("init not called");

    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      this.stakerGSolTokenAccount
    );

    const transaction = new Transaction();

    if (!gsolTokenAccount) {
      const createUserTokenAccount = await this.createGSolTokenAccountIx();
      transaction.add(createUserTokenAccount);
    }

    const depositTx = await blazeDeposit(
      this.config,
      this.program,
      this.blazeState,
      this.provider.publicKey,
      this.stakerGSolTokenAccount,
      lamports
    );

    transaction.add(depositTx);
    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async depositStakeToBlaze(
    stakeAccountAddress: PublicKey
  ): Promise<string> {
    if (!this.config || !this.stakerGSolTokenAccount || !this.blazeState)
      throw new Error("init not called");

    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      this.stakerGSolTokenAccount
    );

    const transaction = new Transaction();

    if (!gsolTokenAccount) {
      const createUserTokenAccount = await this.createGSolTokenAccountIx();
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
    return this.sendAndConfirmTransaction(transaction, []);
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

  public async unstake(lamports: BN): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    const transaction = await liquidUnstake(
      this.config,
      this.marinade,
      this.marinadeState,
      this.program,
      this.stateAddress,
      this.staker,
      this.stakerGSolTokenAccount,
      lamports
    );

    Boolean(this.config?.options.verbose) && logKeys(transaction);

    return this.sendAndConfirmTransaction(transaction, []);
  }

  /**
   * Trigger a rebalance without doing anything else.
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

    const { instruction } = await triggerRebalance(
      this.config,
      this.marinade,
      this.marinadeState,
      this.program,
      this.stateAddress,
      this.provider.publicKey
    );

    const transaction = new Transaction().add(instruction);
    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async orderUnstake(lamports: BN): Promise<[string, PublicKey]> {
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

    const txSig = await this.sendAndConfirmTransaction(transaction, [
      newTicketAccount,
      proxyTicketAccount,
    ]);
    return [txSig, proxyTicketAccount.publicKey];
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
  ): Promise<string> {
    if (!this.marinade || !this.marinadeState)
      throw new Error("init not called");

    const reservePda = await this.marinadeState.reserveAddress();
    const marinadeProgram = this.marinade.marinadeFinanceProgram.programAddress;

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.claimUnstakeTicket>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.stateAddress,
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

    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async claimUnstakeTicketFromAddress(
    ticketAccountAddress: PublicKey
  ): Promise<string> {
    if (!this.marinade || !this.marinadeState)
      throw new Error("init not called");

    const sunriseTicketAccount =
      await this.program.account.sunriseTicketAccount.fetch(
        ticketAccountAddress
      );

    const account = await this.toTicketAccount(
      sunriseTicketAccount,
      ticketAccountAddress
    );

    return this.claimUnstakeTicket(account);
  }

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

    const accounts: Accounts = {
      state: this.stateAddress,
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

    return this.sendAndConfirmTransaction(transaction);
  }

  public calculateWithdrawalFee(withdrawalLamports: BN, details: Details): BN {
    // Calculate how much can be withdrawn from the lp (without fee)
    const lpSolShare = details.lpDetails.lpSolShare;
    const preferredMinLiqPoolValue = new BN(
      details.balances.gsolSupply.amount
    ).muln(0.1);
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

    console.log({
      amountBeingLiquidUnstaked: amountBeingLiquidUnstaked.toString(),
      rentForOrderUnstakeTicket: rentForOrderUnstakeTicket.toString(),
      networkFee: NETWORK_FEE.toString(),
    });

    if (amountBeingLiquidUnstaked.lte(ZERO)) return ZERO;

    // Calculate the fee
    return amountBeingLiquidUnstaked
      .muln(3)
      .divn(1000)
      .addn(rentForOrderUnstakeTicket)
      .addn(NETWORK_FEE);
  }

  public async details(): Promise<Details> {
    if (
      !this.marinadeState ||
      !this.stakerGSolTokenAccount ||
      !this.msolTokenAccount ||
      !this.config
    )
      throw new Error("init not called");

    const epochInfoPromise = this.provider.connection.getEpochInfo();

    const lpMintInfoPromise = this.marinadeState.lpMint.mintInfo();
    const lpMsolBalancePromise =
      this.provider.connection.getTokenAccountBalance(
        this.marinadeState.mSolLeg
      );

    const solLeg = await this.marinadeState.solLeg();
    const solLegBalancePromise = this.provider.connection.getBalance(solLeg);

    const balancesPromise = this.balance();

    const [epochInfo, lpMintInfo, lpSolLegBalance, lpMsolBalance, balances] =
      await Promise.all([
        epochInfoPromise,
        lpMintInfoPromise,
        solLegBalancePromise,
        lpMsolBalancePromise,
        balancesPromise,
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

    // find all inflight unstake tickets (WARNING: for the current and previous epoch only)
    const config = this.config;
    const inflight = await Promise.all(
      [epochInfo.epoch, epochInfo.epoch - 1].map(async (epoch) =>
        orders(config, this.program, BigInt(epoch)).then(
          ({ managementAccount, tickets }) => ({
            epoch: BigInt(epoch),
            tickets: tickets.length,
            totalOrderedLamports:
              managementAccount.account?.totalOrderedLamports ?? ZERO,
          })
        )
      )
    );

    const stakePoolInfo = await getStakePoolAccount(
      this.provider.connection,
      SOLBLAZE_CONFIG.pool
    );
    const [bsolPrice, bsolValue] = this.computeLamportsFromBSol(
      new BN(balances.bsolBalance.amount),
      stakePoolInfo
    );

    const bpDetails = {
      pool: SOLBLAZE_CONFIG.pool.toString(),
      bsolPrice,
      bsolValue,
    };

    const detailsWithoutYield: Omit<Details, "extractableYield"> = {
      staker: this.staker.toBase58(),
      balances,
      epochInfo,
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
      inflight,
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
      stateAddress: this.stateAddress,
      updateAuthority: this.provider.publicKey,
      treasury,
      liqPoolProportion: DEFAULT_LP_PROPORTION,
      liqPoolMinProportion: DEFAULT_LP_MIN_PROPORTION,
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
      mint: SOLBLAZE_CONFIG.bsolMint,
      owner: bsolAuthority,
    });

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.registerState>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: this.stateAddress,
      payer: this.provider.publicKey,
      mint: gsolMint,
      msolMint: marinadeState.mSolMintAddress,
      bsolMint: SOLBLAZE_CONFIG.bsolMint,
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
      blazeState: SOLBLAZE_CONFIG.pool,
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
    epochInfo,
    balances,
    mpDetails,
    lpDetails,
    inflight,
    bpDetails,
  }: Omit<Details, "extractableYield">): BN {
    if (!this.marinadeState || !this.msolTokenAccount)
      throw new Error("init not called");

    // deposited in Stake Pool
    const msolBalance = new BN(balances.msolBalance.amount);
    console.log("msolBalance: ", msolBalance.toString());
    const solValueOfMSol = mpDetails.msolValue;
    console.log("msolValue: ", solValueOfMSol.toString());
    const solValueOfBSol = bpDetails.bsolValue;
    console.log("bsolValue: ", solValueOfBSol.toString());

    // deposited in Liquidity Pool
    const solValueOfLP = lpDetails.lpSolValue;
    console.log("liquidity pool value: ", solValueOfLP.toString());

    const gsolSupply = new BN(balances.gsolSupply.amount);

    const totalSolValueStaked = solValueOfMSol
      .add(solValueOfLP)
      .add(solValueOfBSol);

    console.log("totalValueStaked:", totalSolValueStaked.toString());

    const inflightTotal = inflight.reduce(
      (acc, { totalOrderedLamports }) => acc.add(totalOrderedLamports),
      ZERO
    );

    const extractableSOLGross = totalSolValueStaked
      .add(inflightTotal)
      .sub(gsolSupply);

    const fee = extractableSOLGross.muln(3).divn(1000);

    const extractableSOLEffective = extractableSOLGross.sub(fee);

    console.log({
      epoch: epochInfo.epoch,
      msolBalance: msolBalance.toString(),
      solValueOfMSol: solValueOfMSol.toString(),
      solValueOfBsol: solValueOfBSol.toString(),
      solValueOfLP: solValueOfLP.toString(),
      totalSolValueStaked: totalSolValueStaked.toString(),
      gsolSupply: gsolSupply.toString(),
      extractableSOLGross: extractableSOLGross.toString(),
      fee: fee.toString(),
      extractableSOLEffective: extractableSOLEffective.toString(),
    });

    return extractableSOLEffective;
  }

  public static async register(
    treasury: PublicKey,
    gsolMint: Keypair,
    options: Options = {}
  ): Promise<SunriseStakeClient> {
    const sunriseStakeState = Keypair.generate();
    const client = new SunriseStakeClient(
      setUpAnchor(),
      sunriseStakeState.publicKey,
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
        mint: SOLBLAZE_CONFIG.bsolMint,
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

    const [
      gsolBalance,
      gsolSupply,
      msolLamportsBalance,
      lpBalance,
      treasuryBalance,
      bsolLamportsBalance,
    ] = await Promise.all([
      gsolBalancePromise,
      gsolSupplyPromise,
      msolLamportsBalancePromise,
      liqPoolBalancePromise,
      treasuryBalancePromise,
      bsolLamportsBalancePromise,
    ]);

    return {
      gsolBalance: gsolBalance.value,
      gsolSupply: gsolSupply.value,
      msolBalance: msolLamportsBalance.value,
      msolPrice: this.marinadeState.mSolPrice,
      liqPoolBalance: lpBalance.value,
      treasuryBalance,
      bsolBalance: bsolLamportsBalance.value,
    };
  }

  public static async get(
    provider: AnchorProvider,
    stateAddress: PublicKey,
    options: Options = {}
  ): Promise<SunriseStakeClient> {
    const client = new SunriseStakeClient(provider, stateAddress, options);
    await client.init();
    return client;
  }
}
