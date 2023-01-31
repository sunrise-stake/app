"use strict";
const __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
const __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o.default = v;
      });
const __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    const result = {};
    if (mod != null)
      for (const k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
const __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (const p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
const __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.SunriseStakeClient = void 0;
const SunriseStake_1 = require("./types/SunriseStake");
const anchor = __importStar(require("@project-serum/anchor"));
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
const util_1 = require("./util");
const marinade_ts_sdk_1 = require("@sunrisestake/marinade-ts-sdk");
const bn_js_1 = __importDefault(require("bn.js"));
const spl_token_1 = require("@solana/spl-token");
const constants_1 = require("./constants");
const marinade_1 = require("./marinade");
const blaze_1 = require("./blaze");
const decode_stake_pool_1 = require("./decode_stake_pool");
// export all types
__exportStar(require("./types/SunriseStake"), exports);
__exportStar(require("./types/Details"), exports);
__exportStar(require("./types/TicketAccount"), exports);
__exportStar(require("./types/ManagementAccount"), exports);
__exportStar(require("./types/Solblaze"), exports);
// export all constants
__exportStar(require("./constants"), exports);
class SunriseStakeClient {
  constructor(provider, stateAddress, options = {}) {
    this.provider = provider;
    this.stateAddress = stateAddress;
    this.options = options;
    this.getRegisterStateAccounts = (
      treasury,
      gsolMint,
      options = {}
      // TODO get these types from the IDL
    ) =>
      __awaiter(this, void 0, void 0, function* () {
        const config = {
          gsolMint,
          programId: this.program.programId,
          stateAddress: this.stateAddress,
          updateAuthority: this.provider.publicKey,
          treasury,
          liqPoolProportion: constants_1.DEFAULT_LP_PROPORTION,
          liqPoolMinProportion: constants_1.DEFAULT_LP_MIN_PROPORTION,
          options,
        };
        const marinadeConfig = new marinade_ts_sdk_1.MarinadeConfig({
          connection: this.provider.connection,
        });
        const marinadeState = yield new marinade_ts_sdk_1.Marinade(
          marinadeConfig
        ).getMarinadeState();
        const [, gsolMintAuthorityBump] = (0, util_1.findGSolMintAuthority)(
          config
        );
        const [msolAuthority, msolAuthorityBump] = (0,
        util_1.findMSolTokenAccountAuthority)(config);
        const msolAssociatedTokenAccountAddress =
          yield anchor_1.utils.token.associatedAddress({
            mint: marinadeState.mSolMintAddress,
            owner: msolAuthority,
          });
        // use the same token authority PDA for the msol token account
        // and the liquidity pool token account for convenience
        const liqPoolAssociatedTokenAccountAddress =
          yield anchor_1.utils.token.associatedAddress({
            mint: marinadeState.lpMint.address,
            owner: msolAuthority,
          });
        const [bsolAuthority, bsolAuthorityBump] = (0,
        util_1.findBSolTokenAccountAuthority)(config);
        const bsolTokenAccountAddress =
          yield anchor_1.utils.token.associatedAddress({
            mint: constants_1.SOLBLAZE_CONFIG.bsolMint,
            owner: bsolAuthority,
          });
        const accounts = {
          state: this.stateAddress,
          payer: this.provider.publicKey,
          mint: gsolMint,
          msolMint: marinadeState.mSolMintAddress,
          bsolMint: constants_1.SOLBLAZE_CONFIG.bsolMint,
          msolTokenAccountAuthority: msolAuthority,
          msolTokenAccount: msolAssociatedTokenAccountAddress,
          liqPoolMint: marinadeState.lpMint.address,
          liqPoolTokenAccount: liqPoolAssociatedTokenAccountAddress,
          bsolTokenAccountAuthority: bsolAuthority,
          bsolTokenAccount: bsolTokenAccountAddress,
          systemProgram: web3_js_1.SystemProgram.programId,
          tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
          associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        };
        const parameters = {
          marinadeState: marinadeConfig.marinadeStateAddress,
          blazeState: constants_1.SOLBLAZE_CONFIG.pool,
          updateAuthority: this.provider.publicKey,
          treasury,
          gsolMintAuthorityBump,
          msolAuthorityBump,
          bsolAuthorityBump,
          liqPoolProportion: constants_1.DEFAULT_LP_PROPORTION,
          liqPoolMinProportion: constants_1.DEFAULT_LP_MIN_PROPORTION,
        };
        return { accounts, parameters };
      });
    this.program = new anchor_1.Program(
      SunriseStake_1.IDL,
      util_1.PROGRAM_ID,
      provider
    );
    this.staker = this.provider.publicKey;
  }

  log(...args) {
    let _a;
    Boolean(
      (_a = this.config) === null || _a === void 0 ? void 0 : _a.options.verbose
    ) && console.log(...args);
  }

  init() {
    return __awaiter(this, void 0, void 0, function* () {
      const sunriseStakeState = yield this.program.account.state.fetch(
        this.stateAddress
      );
      const stakePoolInfo = yield (0, decode_stake_pool_1.getStakePoolAccount)(
        this.provider.connection,
        constants_1.SOLBLAZE_CONFIG.pool
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
      this.stakerGSolTokenAccount = web3_js_1.PublicKey.findProgramAddressSync(
        [
          this.staker.toBuffer(),
          spl_token_1.TOKEN_PROGRAM_ID.toBuffer(),
          sunriseStakeState.gsolMint.toBuffer(),
        ],
        spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID
      )[0];
      const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(
        this.config
      );
      this.msolTokenAccountAuthority = (0,
      util_1.findMSolTokenAccountAuthority)(this.config)[0];
      this.bsolTokenAccountAuthority = (0,
      util_1.findBSolTokenAccountAuthority)(this.config)[0];
      const marinadeConfig = new marinade_ts_sdk_1.MarinadeConfig({
        connection: this.provider.connection,
        publicKey: this.provider.publicKey,
        proxyStateAddress: this.stateAddress,
        proxySolMintAuthority: gsolMintAuthority,
        proxySolMintAddress: this.config.gsolMint,
        msolTokenAccountAuthority: this.msolTokenAccountAuthority,
        proxyTreasury: this.config.treasury,
      });
      this.marinade = new marinade_ts_sdk_1.Marinade(marinadeConfig);
      this.marinadeState = yield this.marinade.getMarinadeState();
      this.msolTokenAccount = yield anchor_1.utils.token.associatedAddress({
        mint: this.marinadeState.mSolMintAddress,
        owner: this.msolTokenAccountAuthority,
      });
      this.liqPoolTokenAccount = yield anchor_1.utils.token.associatedAddress({
        mint: this.marinadeState.lpMint.address,
        owner: this.msolTokenAccountAuthority,
      });
      const [withdrawAuthority] = web3_js_1.PublicKey.findProgramAddressSync(
        [constants_1.SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("withdraw")],
        constants_1.STAKE_POOL_PROGRAM_ID
      );
      const [depositAuthority] = web3_js_1.PublicKey.findProgramAddressSync(
        [constants_1.SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("deposit")],
        constants_1.STAKE_POOL_PROGRAM_ID
      );
      this.blazeState = {
        pool: constants_1.SOLBLAZE_CONFIG.pool,
        bsolMint: stakePoolInfo.poolMint,
        validatorList: stakePoolInfo.validatorList,
        reserveAccount: stakePoolInfo.reserveStake,
        managerAccount: stakePoolInfo.manager,
        feesDepot: stakePoolInfo.managerFeeAccount,
        withdrawAuthority,
        depositAuthority,
      };
      this.bsolTokenAccount = yield anchor_1.utils.token.associatedAddress({
        mint: stakePoolInfo.poolMint,
        owner: this.bsolTokenAccountAuthority,
      });
    });
  }

  sendAndConfirmTransaction(transaction, signers, opts) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.provider
        .sendAndConfirm(transaction, signers, opts)
        .catch((e) => {
          this.log(e.logs);
          throw e;
        });
    });
  }

  createGSolTokenAccountIx() {
    if (!this.stakerGSolTokenAccount || !this.config)
      throw new Error("init not called");
    const createATAInstruction = (0,
    spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(
      this.provider.publicKey,
      this.stakerGSolTokenAccount,
      this.staker,
      this.config.gsolMint
    );
    return createATAInstruction;
  }

  makeDeposit(lamports) {
    return __awaiter(this, void 0, void 0, function* () {
      const details = yield this.details();
      if ((0, util_1.marinadeTargetReached)(details, 75)) {
        console.log("Routing deposit to Solblaze");
        return this.depositToBlaze(lamports);
      }
      console.log("Depositing to marinade");
      return this.deposit(lamports);
    });
  }

  deposit(lamports) {
    return __awaiter(this, void 0, void 0, function* () {
      if (
        !this.marinadeState ||
        !this.marinade ||
        !this.config ||
        !this.stakerGSolTokenAccount
      )
        throw new Error("init not called");
      const gsolTokenAccount = yield this.provider.connection.getAccountInfo(
        this.stakerGSolTokenAccount
      );
      const transaction = new web3_js_1.Transaction();
      if (!gsolTokenAccount) {
        const createUserTokenAccount = yield this.createGSolTokenAccountIx();
        transaction.add(createUserTokenAccount);
      }
      const depositTx = yield (0, marinade_1.deposit)(
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
    });
  }

  depositToBlaze(lamports) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.config || !this.stakerGSolTokenAccount || !this.blazeState)
        throw new Error("init not called");
      const gsolTokenAccount = yield this.provider.connection.getAccountInfo(
        this.stakerGSolTokenAccount
      );
      const transaction = new web3_js_1.Transaction();
      if (!gsolTokenAccount) {
        const createUserTokenAccount = yield this.createGSolTokenAccountIx();
        transaction.add(createUserTokenAccount);
      }
      const depositTx = yield (0, blaze_1.blazeDeposit)(
        this.config,
        this.program,
        this.blazeState,
        this.provider.publicKey,
        this.stakerGSolTokenAccount,
        lamports
      );
      transaction.add(depositTx);
      return this.sendAndConfirmTransaction(transaction, []);
    });
  }

  depositStakeToBlaze(stakeAccountAddress) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.config || !this.stakerGSolTokenAccount || !this.blazeState)
        throw new Error("init not called");
      const gsolTokenAccount = yield this.provider.connection.getAccountInfo(
        this.stakerGSolTokenAccount
      );
      const transaction = new web3_js_1.Transaction();
      if (!gsolTokenAccount) {
        const createUserTokenAccount = yield this.createGSolTokenAccountIx();
        transaction.add(createUserTokenAccount);
      }
      const depositTx = yield (0, blaze_1.blazeDepositStake)(
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
    });
  }

  depositStakeAccount(stakeAccountAddress) {
    return __awaiter(this, void 0, void 0, function* () {
      if (
        !this.marinadeState ||
        !this.marinade ||
        !this.config ||
        !this.stakerGSolTokenAccount
      )
        throw new Error("init not called");
      const transaction = new web3_js_1.Transaction();
      const gSolTokenAccount = yield this.provider.connection.getAccountInfo(
        this.stakerGSolTokenAccount
      );
      if (!gSolTokenAccount) {
        const createUserTokenAccount = this.createGSolTokenAccountIx();
        transaction.add(createUserTokenAccount);
      }
      const depositStakeIx = yield (0, marinade_1.depositStakeAccount)(
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
    });
  }

  unstake(lamports) {
    let _a;
    return __awaiter(this, void 0, void 0, function* () {
      if (
        !this.marinadeState ||
        !this.marinade ||
        !this.config ||
        !this.msolTokenAccount ||
        !this.stakerGSolTokenAccount
      )
        throw new Error("init not called");
      const transaction = yield (0, marinade_1.liquidUnstake)(
        this.config,
        this.marinade,
        this.marinadeState,
        this.program,
        this.stateAddress,
        this.staker,
        this.stakerGSolTokenAccount,
        lamports
      );
      Boolean(
        (_a = this.config) === null || _a === void 0
          ? void 0
          : _a.options.verbose
      ) && (0, util_1.logKeys)(transaction);
      return this.sendAndConfirmTransaction(transaction, []);
    });
  }

  /**
   * Trigger a rebalance without doing anything else.
   */
  triggerRebalance() {
    return __awaiter(this, void 0, void 0, function* () {
      if (
        !this.marinadeState ||
        !this.marinade ||
        !this.config ||
        !this.msolTokenAccount ||
        !this.stakerGSolTokenAccount
      )
        throw new Error("init not called");
      const { instruction } = yield (0, marinade_1.triggerRebalance)(
        this.config,
        this.marinade,
        this.marinadeState,
        this.program,
        this.stateAddress,
        this.provider.publicKey
      );
      const transaction = new web3_js_1.Transaction().add(instruction);
      return this.sendAndConfirmTransaction(transaction, []);
    });
  }

  orderUnstake(lamports) {
    let _a;
    return __awaiter(this, void 0, void 0, function* () {
      if (
        !this.marinadeState ||
        !this.marinade ||
        !this.config ||
        !this.msolTokenAccount
      )
        throw new Error("init not called");
      const { transaction, newTicketAccount, proxyTicketAccount } =
        yield this.marinade.orderUnstake(lamports, this.msolTokenAccount);
      Boolean(
        (_a = this.config) === null || _a === void 0
          ? void 0
          : _a.options.verbose
      ) && (0, util_1.logKeys)(transaction);
      const txSig = yield this.sendAndConfirmTransaction(transaction, [
        newTicketAccount,
        proxyTicketAccount,
      ]);
      return [txSig, proxyTicketAccount.publicKey];
    });
  }

  toTicketAccount(sunriseTicketAccount, address) {
    let _a;
    return __awaiter(this, void 0, void 0, function* () {
      const marinadeTicketAccount = yield (_a = this.marinade) === null ||
      _a === void 0
        ? void 0
        : _a.getDelayedUnstakeTicket(
            sunriseTicketAccount.marinadeTicketAccount
          );
      if (!marinadeTicketAccount)
        throw new Error(
          `Marinade ticket with address ${sunriseTicketAccount.marinadeTicketAccount.toString()} not found`
        );
      return Object.assign(
        Object.assign({ address }, sunriseTicketAccount),
        marinadeTicketAccount
      );
    });
  }

  getDelayedUnstakeTickets() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.marinade) throw new Error("init not called");
      const beneficiary = this.provider.publicKey;
      const ticketAccounts =
        yield this.program.account.sunriseTicketAccount.all([
          {
            memcmp: {
              offset: 8 + 32 + 32,
              bytes: beneficiary.toBase58(),
            },
          },
        ]);
      const resolvedTicketAccountPromises = ticketAccounts.map(
        ({ account, publicKey }) =>
          __awaiter(this, void 0, void 0, function* () {
            return this.toTicketAccount(account, publicKey);
          })
      );
      return Promise.all(resolvedTicketAccountPromises);
    });
  }

  claimUnstakeTicket(ticketAccount) {
    let _a;
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.marinade || !this.marinadeState)
        throw new Error("init not called");
      const reservePda = yield this.marinadeState.reserveAddress();
      const marinadeProgram =
        this.marinade.marinadeFinanceProgram.programAddress;
      const accounts = {
        state: this.stateAddress,
        marinadeState: this.marinadeState.marinadeStateAddress,
        reservePda,
        marinadeTicketAccount: ticketAccount.marinadeTicketAccount,
        sunriseTicketAccount: ticketAccount.address,
        msolAuthority: this.msolTokenAccountAuthority,
        transferSolTo: this.staker,
        systemProgram: web3_js_1.SystemProgram.programId,
        clock: web3_js_1.SYSVAR_CLOCK_PUBKEY,
        marinadeProgram,
      };
      const transaction = yield this.program.methods
        .claimUnstakeTicket()
        .accounts(accounts)
        .transaction();
      Boolean(
        (_a = this.config) === null || _a === void 0
          ? void 0
          : _a.options.verbose
      ) && (0, util_1.logKeys)(transaction);
      return this.sendAndConfirmTransaction(transaction, []);
    });
  }

  claimUnstakeTicketFromAddress(ticketAccountAddress) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.marinade || !this.marinadeState)
        throw new Error("init not called");
      const sunriseTicketAccount =
        yield this.program.account.sunriseTicketAccount.fetch(
          ticketAccountAddress
        );
      const account = yield this.toTicketAccount(
        sunriseTicketAccount,
        ticketAccountAddress
      );
      return this.claimUnstakeTicket(account);
    });
  }

  withdrawFromBlaze(amount) {
    return __awaiter(this, void 0, void 0, function* () {
      if (
        !this.blazeState ||
        !this.config ||
        !this.stakerGSolTokenAccount ||
        !this.bsolTokenAccount
      )
        throw new Error("init not called");
      const withdrawIx = yield (0, blaze_1.blazeWithdrawSol)(
        this.config,
        this.program,
        this.blazeState,
        this.provider.publicKey,
        this.stakerGSolTokenAccount,
        amount
      );
      const transaction = new web3_js_1.Transaction().add(withdrawIx);
      return this.sendAndConfirmTransaction(transaction, []);
    });
  }

  withdrawStakeFromBlaze(newStakeAccount, amount) {
    return __awaiter(this, void 0, void 0, function* () {
      if (
        !this.blazeState ||
        !this.config ||
        !this.stakerGSolTokenAccount ||
        !this.bsolTokenAccount
      )
        throw new Error("init not called");
      const withdrawStakeIx = yield (0, blaze_1.blazeWithdrawStake)(
        this.config,
        this.program,
        this.blazeState,
        newStakeAccount,
        this.provider.publicKey,
        this.stakerGSolTokenAccount,
        amount
      );
      const transaction = new web3_js_1.Transaction().add(withdrawStakeIx);
      return this.sendAndConfirmTransaction(transaction, []);
    });
  }

  extractYieldIx() {
    return __awaiter(this, void 0, void 0, function* () {
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
      const marinadeProgram =
        this.marinade.marinadeFinanceProgram.programAddress;
      const liqPoolSolLegPda = yield this.marinadeState.solLeg();
      const accounts = {
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
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        marinadeProgram,
      };
      return this.program.methods
        .extractToTreasury()
        .accounts(accounts)
        .instruction();
    });
  }

  extractYield() {
    return __awaiter(this, void 0, void 0, function* () {
      const instruction = yield this.extractYieldIx();
      const transaction = new web3_js_1.Transaction().add(instruction);
      return this.sendAndConfirmTransaction(transaction);
    });
  }

  calculateWithdrawalFee(withdrawalLamports, details) {
    // Calculate how much can be withdrawn from the lp (without fee)
    const lpSolShare = details.lpDetails.lpSolShare;
    const preferredMinLiqPoolValue = new bn_js_1.default(
      details.balances.gsolSupply.amount
    ).muln(0.1);
    const postUnstakeLpSolValue = new bn_js_1.default(lpSolShare).sub(
      withdrawalLamports
    );
    // Calculate how much will be withdrawn through liquid unstaking (with fee)
    const amountBeingLiquidUnstaked = withdrawalLamports.sub(lpSolShare);
    // Determine if a rebalance will occur (if the lp value is too low)
    // This will incur a cost due to the unstake ticket rent
    const amountToOrderUnstake = new bn_js_1.default(
      preferredMinLiqPoolValue
    ).sub(postUnstakeLpSolValue);
    const rentForOrderUnstakeTicket = amountToOrderUnstake.gt(util_1.ZERO)
      ? constants_1.MARINADE_TICKET_RENT
      : 0;
    console.log({
      amountBeingLiquidUnstaked: amountBeingLiquidUnstaked.toString(),
      rentForOrderUnstakeTicket: rentForOrderUnstakeTicket.toString(),
      networkFee: constants_1.NETWORK_FEE.toString(),
    });
    if (amountBeingLiquidUnstaked.lte(util_1.ZERO)) return util_1.ZERO;
    // Calculate the fee
    return amountBeingLiquidUnstaked
      .muln(3)
      .divn(1000)
      .addn(rentForOrderUnstakeTicket)
      .addn(constants_1.NETWORK_FEE);
  }

  details() {
    let _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
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
      const solLeg = yield this.marinadeState.solLeg();
      const solLegBalancePromise = this.provider.connection.getBalance(solLeg);
      const balancesPromise = this.balance();
      const [epochInfo, lpMintInfo, lpSolLegBalance, lpMsolBalance, balances] =
        yield Promise.all([
          epochInfoPromise,
          lpMintInfoPromise,
          solLegBalancePromise,
          lpMsolBalancePromise,
          balancesPromise,
        ]);
      const availableLiqPoolSolLegBalance = new bn_js_1.default(
        lpSolLegBalance
      ).sub(this.marinadeState.state.rentExemptForTokenAcc);
      const lpMsolShare = (0, util_1.proportionalBN)(
        new bn_js_1.default(balances.liqPoolBalance.amount),
        new bn_js_1.default(lpMsolBalance.value.amount),
        new bn_js_1.default(lpMintInfo.supply.toString())
      );
      const lpSolShare = (0, util_1.proportionalBN)(
        new bn_js_1.default(balances.liqPoolBalance.amount),
        availableLiqPoolSolLegBalance,
        new bn_js_1.default(lpMintInfo.supply.toString())
      );
      const solValueOlpMSolShare = this.computeLamportsFromMSol(
        lpMsolShare,
        this.marinadeState
      );
      const lpSolValue = lpSolShare.add(solValueOlpMSolShare);
      const solValueOfMSol = this.computeLamportsFromMSol(
        new bn_js_1.default(balances.msolBalance.amount),
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
        mintAuthority:
          (_a = lpMintInfo.mintAuthority) === null || _a === void 0
            ? void 0
            : _a.toBase58(),
        decimals: lpMintInfo.decimals,
        lpSolShare,
        lpMsolShare,
        lpSolValue,
        msolLeg: this.marinadeState.mSolLeg.toBase58(),
      };
      // find all inflight unstake tickets (WARNING: for the current and previous epoch only)
      const config = this.config;
      const inflight = yield Promise.all(
        [epochInfo.epoch, epochInfo.epoch - 1].map((epoch) =>
          __awaiter(this, void 0, void 0, function* () {
            return (0, marinade_1.orders)(
              config,
              this.program,
              BigInt(epoch)
            ).then(({ managementAccount, tickets }) => {
              let _a, _b;
              return {
                epoch: BigInt(epoch),
                tickets: tickets.length,
                totalOrderedLamports:
                  (_b =
                    (_a = managementAccount.account) === null || _a === void 0
                      ? void 0
                      : _a.totalOrderedLamports) !== null && _b !== void 0
                    ? _b
                    : util_1.ZERO,
              };
            });
          })
        )
      );
      const stakePoolInfo = yield (0, decode_stake_pool_1.getStakePoolAccount)(
        this.provider.connection,
        constants_1.SOLBLAZE_CONFIG.pool
      );
      const [bsolPrice, bsolValue] = this.computeLamportsFromBSol(
        new bn_js_1.default(balances.bsolBalance.amount),
        stakePoolInfo
      );
      const bpDetails = {
        pool: constants_1.SOLBLAZE_CONFIG.pool.toString(),
        bsolPrice,
        bsolValue,
      };
      const detailsWithoutYield = {
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
          msolTokenAccountAuthority:
            (_b = this.msolTokenAccountAuthority) === null || _b === void 0
              ? void 0
              : _b.toBase58(),
        },
        marinadeFinanceProgramId:
          this.marinadeState.marinadeFinanceProgramId.toBase58(),
        marinadeStateAddress:
          this.marinadeState.marinadeStateAddress.toBase58(),
        mpDetails,
        lpDetails,
        bpDetails,
        inflight,
      };
      const extractableYield =
        this.calculateExtractableYield(detailsWithoutYield);
      return Object.assign(Object.assign({}, detailsWithoutYield), {
        extractableYield,
      });
    });
  }

  computeLamportsFromMSol(msolAmount, marinadeState) {
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
    return (0, util_1.proportionalBN)(
      msolAmount,
      totalVirtualStakedLamports,
      marinadeState.state.msolSupply
    );
  }

  computeLamportsFromBSol(bsolAmount, stakePoolInfo) {
    const bsolPrice =
      Number(stakePoolInfo.totalLamports) /
      Number(stakePoolInfo.poolTokenSupply);
    const solValue = Math.floor(Number(bsolAmount) * bsolPrice);
    return [bsolPrice, new bn_js_1.default(solValue)];
  }

  calculateExtractableYield({
    epochInfo,
    balances,
    mpDetails,
    lpDetails,
    inflight,
    bpDetails,
  }) {
    if (!this.marinadeState || !this.msolTokenAccount)
      throw new Error("init not called");
    // deposited in Stake Pool
    const msolBalance = new bn_js_1.default(balances.msolBalance.amount);
    console.log("msolBalance: ", msolBalance.toString());
    const solValueOfMSol = mpDetails.msolValue;
    console.log("msolValue: ", solValueOfMSol.toString());
    const solValueOfBSol = bpDetails.bsolValue;
    console.log("bsolValue: ", solValueOfBSol.toString());
    // deposited in Liquidity Pool
    const solValueOfLP = lpDetails.lpSolValue;
    console.log("liquidity pool value: ", solValueOfLP.toString());
    const gsolSupply = new bn_js_1.default(balances.gsolSupply.amount);
    const totalSolValueStaked = solValueOfMSol
      .add(solValueOfLP)
      .add(solValueOfBSol);
    console.log("totalValueStaked:", totalSolValueStaked.toString());
    const inflightTotal = inflight.reduce(
      (acc, { totalOrderedLamports }) => acc.add(totalOrderedLamports),
      util_1.ZERO
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

  static register(treasury, gsolMint, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
      const sunriseStakeState = web3_js_1.Keypair.generate();
      const client = new SunriseStakeClient(
        (0, util_1.setUpAnchor)(),
        sunriseStakeState.publicKey,
        options
      );
      const { accounts, parameters } = yield client.getRegisterStateAccounts(
        treasury,
        gsolMint.publicKey,
        options
      );
      yield client.program.methods
        .registerState(parameters)
        .accounts(accounts)
        .signers([gsolMint, sunriseStakeState])
        .rpc()
        .then((0, util_1.confirm)(client.provider.connection));
      yield client.init();
      return client;
    });
  }

  update({
    newTreasury,
    newUpdateAuthority,
    newliqPoolProportion,
    newliqPoolMinProportion,
  }) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.config) throw new Error("init not called");
      const { accounts, parameters } = yield this.getRegisterStateAccounts(
        newTreasury !== null && newTreasury !== void 0
          ? newTreasury
          : this.config.treasury,
        this.config.gsolMint
      );
      yield this.program.methods
        .updateState(
          Object.assign(Object.assign({}, parameters), {
            updateAuthority:
              newUpdateAuthority !== null && newUpdateAuthority !== void 0
                ? newUpdateAuthority
                : parameters.updateAuthority,
            liqPoolProportion:
              newliqPoolProportion !== null && newliqPoolProportion !== void 0
                ? newliqPoolProportion
                : parameters.liqPoolProportion,
            liqPoolMinProportion:
              newliqPoolMinProportion !== null &&
              newliqPoolMinProportion !== void 0
                ? newliqPoolMinProportion
                : parameters.liqPoolMinProportion,
          })
        )
        .accounts(accounts)
        .rpc()
        .then((0, util_1.confirm)(this.provider.connection));
      yield this.init();
    });
  }

  balance() {
    return __awaiter(this, void 0, void 0, function* () {
      if (!this.marinadeState || !this.stakerGSolTokenAccount || !this.config)
        throw new Error("init not called");
      const gsolBalancePromise = this.provider.connection
        .getTokenAccountBalance(this.stakerGSolTokenAccount)
        .catch((e) => {
          // Treat a missing account as zero balance
          if (e.message.endsWith("could not find account")) {
            return util_1.ZERO_BALANCE;
          }
          throw e;
        });
      const gsolSupplyPromise = this.provider.connection.getTokenSupply(
        this.config.gsolMint
      );
      const msolTokenAccountAuthority = (0,
      util_1.findMSolTokenAccountAuthority)(this.config)[0];
      const msolAssociatedTokenAccountAddress =
        yield anchor_1.utils.token.associatedAddress({
          mint: this.marinadeState.mSolMintAddress,
          owner: msolTokenAccountAuthority,
        });
      const msolLamportsBalancePromise =
        this.provider.connection.getTokenAccountBalance(
          msolAssociatedTokenAccountAddress
        );
      const bsolTokenAccountAuthority = (0,
      util_1.findBSolTokenAccountAuthority)(this.config)[0];
      const bsolAssociatedTokenAccountAddress =
        yield anchor_1.utils.token.associatedAddress({
          mint: constants_1.SOLBLAZE_CONFIG.bsolMint,
          owner: bsolTokenAccountAuthority,
        });
      const bsolLamportsBalancePromise =
        this.provider.connection.getTokenAccountBalance(
          bsolAssociatedTokenAccountAddress
        );
      // use the same token authority PDA for the msol token account
      // and the liquidity pool token account for convenience
      const liqPoolAssociatedTokenAccountAddress =
        yield anchor_1.utils.token.associatedAddress({
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
      ] = yield Promise.all([
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
    });
  }

  static get(provider, stateAddress, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
      const client = new SunriseStakeClient(provider, stateAddress, options);
      yield client.init();
      return client;
    });
  }
}
exports.SunriseStakeClient = SunriseStakeClient;
