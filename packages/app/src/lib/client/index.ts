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
} from "@solana/web3.js";
import {
  confirm,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  SunriseStakeConfig,
  logKeys,
  Options,
  PROGRAM_ID,
  setUpAnchor,
  ZERO_BALANCE,
  Balance,
  proportionalBN,
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
import { DEFAULT_LP_MIN_PROPORTION, DEFAULT_LP_PROPORTION } from "../constants";
import { liquidUnstake, triggerRebalance } from "./marinade";

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

    this.log("Config", this.config);

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

  async createGSolTokenAccount(): Promise<string> {
    if (!this.stakerGSolTokenAccount || !this.config)
      throw new Error("init not called");

    // give the staker a gSOL account
    const createATAInstruction =
      createAssociatedTokenAccountIdempotentInstruction(
        this.provider.publicKey,
        this.stakerGSolTokenAccount,
        this.staker,
        this.config.gsolMint
      );
    const createATAIx = new Transaction().add(createATAInstruction);
    return this.sendAndConfirmTransaction(createATAIx, []);
  }

  public async deposit(lamports: BN): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    // TODO chain these so the user does not have to sign up to three txes
    // Create the user's gsol token account if it does not exist
    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      this.stakerGSolTokenAccount
    );
    if (!gsolTokenAccount) {
      await this.createGSolTokenAccount();
    }

    this.log("Token account created. Depositing...");

    const { transaction } = await this.marinade.deposit(lamports);

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
      this.stateAddress
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

  public async extractYield(): Promise<string> {
    if (
      !this.marinadeState ||
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
      msolMint: this.marinadeState.mSolMintAddress,
      gsolMint: this.config.gsolMint,
      liqPoolMint: this.marinadeState.lpMint.address,
      liqPoolSolLegPda,
      liqPoolMsolLeg: this.marinadeState.mSolLeg,
      liqPoolTokenAccount: this.liqPoolTokenAccount,
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.msolTokenAccount,
      getMsolFromAuthority: this.msolTokenAccountAuthority,
      treasury: this.config.treasury,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      marinadeProgram,
    };

    const transaction = await this.program.methods
      .extractToTreasury()
      .accounts(accounts)
      .transaction();

    return this.sendAndConfirmTransaction(transaction, []);
  }

  public async details(): Promise<Details> {
    if (
      !this.marinadeState ||
      !this.stakerGSolTokenAccount ||
      !this.msolTokenAccount ||
      !this.config
    )
      throw new Error("init not called");

    const lpMintInfoPromise = this.marinadeState.lpMint.mintInfo();
    const lpMsolBalancePromise =
      this.provider.connection.getTokenAccountBalance(
        this.marinadeState.mSolLeg
      );

    const solLeg = await this.marinadeState.solLeg();
    const solLegBalancePromise = this.provider.connection.getBalance(solLeg);

    const balancesPromise = this.balance();

    const [lpMintInfo, lpSolLegBalance, lpMsolBalance, balances] =
      await Promise.all([
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

    const spDetails = {
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
      lpSolValue, // total SOL value of the LP tokens held by the sunrise instance
      msolLeg: this.marinadeState.mSolLeg.toBase58(),
    };

    return {
      staker: this.staker.toBase58(),
      balances,
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
      spDetails,
      lpDetails,
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

  public async extractableYield(): Promise<BN> {
    if (!this.marinadeState || !this.msolTokenAccount)
      throw new Error("init not called");

    const { balances, spDetails, lpDetails } = await this.details();

    // deposited in Stake Pool
    const msolBalance = new BN(balances.msolBalance.amount);
    const solValueOfMSol = spDetails.msolValue;

    // deposited in Liquidity Pool
    const solValueOfLP = lpDetails.lpSolValue;

    const gsolSupply = new BN(balances.gsolBalance.amount);

    const totalSolValueStaked = solValueOfMSol.add(solValueOfLP);
    const extractableSOLGross = totalSolValueStaked.sub(gsolSupply);

    const fee = extractableSOLGross.muln(3).divn(1000);

    const extractableSOLEffective = extractableSOLGross.sub(fee);

    this.log({
      msolBalance: msolBalance.toString(),
      solValueOfMSol: solValueOfMSol.toString(),
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

    const config = {
      gsolMint: gsolMint.publicKey,
      programId: client.program.programId,
      stateAddress: sunriseStakeState.publicKey,
      updateAuthority: client.provider.publicKey,
      treasury,
      liqPoolProportion: DEFAULT_LP_PROPORTION,
      liqPoolMinProportion: DEFAULT_LP_MIN_PROPORTION,
      options,
    };
    const marinadeConfig = new MarinadeConfig({
      connection: client.provider.connection,
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

    type Accounts = Parameters<
      ReturnType<typeof client.program.methods.registerState>["accounts"]
    >[0];

    const accounts: Accounts = {
      state: sunriseStakeState.publicKey,
      payer: client.provider.publicKey,
      mint: gsolMint.publicKey,
      msolMint: marinadeState.mSolMintAddress,
      msolTokenAccountAuthority: msolAuthority,
      msolTokenAccount: msolAssociatedTokenAccountAddress,
      liqPoolMint: marinadeState.lpMint.address,
      liqPoolTokenAccount: liqPoolAssociatedTokenAccountAddress,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    };

    await client.program.methods
      .registerState({
        marinadeState: marinadeConfig.marinadeStateAddress,
        updateAuthority: client.provider.publicKey,
        treasury,
        gsolMintAuthorityBump,
        msolAuthorityBump,
        liqPoolProportion: DEFAULT_LP_PROPORTION,
        liqPoolMinProportion: DEFAULT_LP_MIN_PROPORTION,
      })
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

    const accounts: Record<string, PublicKey> = {
      state: this.stateAddress,
      payer: this.provider.publicKey,
      updateAuthority: this.provider.publicKey,
    };

    await this.program.methods
      .updateState({
        updateAuthority: newUpdateAuthority ?? this.config.updateAuthority,
        treasury: newTreasury ?? this.config.treasury,
        liqPoolProportion:
          newliqPoolProportion ?? this.config.liqPoolProportion,
        liqPoolMinProportion:
          newliqPoolMinProportion ?? this.config.liqPoolMinProportion,
      })
      .accounts(accounts)
      .rpc()
      .then(confirm(this.provider.connection));

    await this.init();
  }

  public async balance(): Promise<Balance> {
    if (!this.marinadeState || !this.stakerGSolTokenAccount || !this.config)
      throw new Error("init not called");
    const depositedLamportsPromise = this.provider.connection
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

    const [depositedLamports, gsolSupply, msolLamportsBalance, lpBalance] =
      await Promise.all([
        depositedLamportsPromise,
        gsolSupplyPromise,
        msolLamportsBalancePromise,
        liqPoolBalancePromise,
      ]);

    return {
      gsolBalance: depositedLamports.value,
      totalDepositedSol: gsolSupply.value,
      msolBalance: msolLamportsBalance.value,
      msolPrice: this.marinadeState.mSolPrice,
      liqPoolBalance: lpBalance.value,
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
