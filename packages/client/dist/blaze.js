"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.blazeWithdrawStake =
  exports.blazeWithdrawSol =
  exports.blazeDepositStake =
  exports.blazeDeposit =
    void 0;
const web3_js_1 = require("@solana/web3.js");
const util_1 = require("./util");
const constants_1 = require("./constants");
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const marinade_ts_sdk_1 = require("@sunrisestake/marinade-ts-sdk");
const blazeDeposit = (
  config,
  program,
  blaze,
  depositor,
  depositorGsolTokenAccount,
  lamports
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(config);
    const bsolTokenAccountAuthority = (0, util_1.findBSolTokenAccountAuthority)(
      config
    )[0];
    const bsolAssociatedTokenAddress =
      yield anchor_1.utils.token.associatedAddress({
        mint: blaze.bsolMint,
        owner: bsolTokenAccountAuthority,
      });
    const accounts = {
      state: config.stateAddress,
      gsolMint: config.gsolMint,
      gsolMintAuthority,
      depositor,
      depositorGsolTokenAccount,
      bsolTokenAccount: bsolAssociatedTokenAddress,
      bsolAccountAuthority: bsolTokenAccountAuthority,
      stakePool: blaze.pool,
      stakePoolWithdrawAuthority: blaze.withdrawAuthority,
      reserveStakeAccount: blaze.reserveAccount,
      managerFeeAccount: blaze.feesDepot,
      stakePoolTokenMint: blaze.bsolMint,
      stakePoolProgram: constants_1.STAKE_POOL_PROGRAM_ID,
      systemProgram: web3_js_1.SystemProgram.programId,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    };
    return program.methods
      .splDepositSol(lamports)
      .accounts(accounts)
      .transaction();
  });
exports.blazeDeposit = blazeDeposit;
const blazeDepositStake = (
  config,
  program,
  provider,
  blaze,
  depositor,
  stakeAccount,
  depositorGsolTokenAccount
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(config);
    const bsolTokenAccountAuthority = (0, util_1.findBSolTokenAccountAuthority)(
      config
    )[0];
    const bsolAssociatedTokenAddress =
      yield anchor_1.utils.token.associatedAddress({
        mint: blaze.bsolMint,
        owner: bsolTokenAccountAuthority,
      });
    const newProvider = new marinade_ts_sdk_1.Provider(
      provider.connection,
      provider.wallet,
      {}
    );
    const stakeAccountInfo =
      yield marinade_ts_sdk_1.MarinadeUtils.getParsedStakeAccountInfo(
        newProvider,
        stakeAccount
      );
    const validatorAccount = stakeAccountInfo.voterAddress;
    if (!validatorAccount) {
      throw new Error(`Invalid validator account`);
    }
    // const validatorAccount = await getVoterAddress(
    //  stakeAccount, provider);
    const accounts = {
      state: config.stateAddress,
      gsolMint: config.gsolMint,
      gsolMintAuthority,
      stakeAccountDepositor: depositor,
      stakeAccount,
      depositorGsolTokenAccount,
      bsolTokenAccount: bsolAssociatedTokenAddress,
      bsolAccountAuthority: bsolTokenAccountAuthority,
      stakePool: blaze.pool,
      validatorList: blaze.validatorList,
      stakePoolDepositAuthority: blaze.depositAuthority,
      stakePoolWithdrawAuthority: blaze.withdrawAuthority,
      validatorStakeAccount: validatorAccount,
      reserveStakeAccount: blaze.reserveAccount,
      managerFeeAccount: blaze.feesDepot,
      stakePoolTokenMint: blaze.bsolMint,
      sysvarStakeHistory: web3_js_1.SYSVAR_STAKE_HISTORY_PUBKEY,
      sysvarClock: web3_js_1.SYSVAR_CLOCK_PUBKEY,
      nativeStakeProgram: web3_js_1.StakeProgram.programId,
      stakePoolProgram: constants_1.STAKE_POOL_PROGRAM_ID,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    };
    return program.methods.splDepositStake().accounts(accounts).transaction();
  });
exports.blazeDepositStake = blazeDepositStake;
const blazeWithdrawSol = (
  config,
  program,
  blaze,
  user,
  userGsolTokenAccount,
  amount
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(config);
    const bsolTokenAccountAuthority = (0, util_1.findBSolTokenAccountAuthority)(
      config
    )[0];
    const bsolAssociatedTokenAddress =
      yield anchor_1.utils.token.associatedAddress({
        mint: blaze.bsolMint,
        owner: bsolTokenAccountAuthority,
      });
    const accounts = {
      state: config.stateAddress,
      gsolMint: config.gsolMint,
      gsolMintAuthority,
      user,
      userGsolTokenAccount,
      bsolTokenAccount: bsolAssociatedTokenAddress,
      bsolAccountAuthority: bsolTokenAccountAuthority,
      stakePool: blaze.pool,
      stakePoolWithdrawAuthority: blaze.withdrawAuthority,
      reserveStakeAccount: blaze.reserveAccount,
      managerFeeAccount: blaze.feesDepot,
      stakePoolTokenMint: blaze.bsolMint,
      sysvarStakeHistory: web3_js_1.SYSVAR_STAKE_HISTORY_PUBKEY,
      sysvarClock: web3_js_1.SYSVAR_CLOCK_PUBKEY,
      nativeStakeProgram: web3_js_1.StakeProgram.programId,
      stakePoolProgram: constants_1.STAKE_POOL_PROGRAM_ID,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    };
    return program.methods
      .splWithdrawSol(amount)
      .accounts(accounts)
      .transaction();
  });
exports.blazeWithdrawSol = blazeWithdrawSol;
const blazeWithdrawStake = (
  config,
  program,
  blaze,
  newStakeAccount,
  user,
  userGsolTokenAccount,
  amount
) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(config);
    const bsolTokenAccountAuthority = (0, util_1.findBSolTokenAccountAuthority)(
      config
    )[0];
    const bsolAssociatedTokenAddress =
      yield anchor_1.utils.token.associatedAddress({
        mint: blaze.bsolMint,
        owner: bsolTokenAccountAuthority,
      });
    const accounts = {
      state: config.stateAddress,
      gsolMint: config.gsolMint,
      gsolMintAuthority,
      user,
      userGsolTokenAccount,
      userNewStakeAccount: newStakeAccount,
      bsolTokenAccount: bsolAssociatedTokenAddress,
      bsolAccountAuthority: bsolTokenAccountAuthority,
      stakePool: blaze.pool,
      validatorStakeList: blaze.validatorList,
      stakePoolWithdrawAuthority: blaze.withdrawAuthority,
      stakeAccountToSplit: blaze.reserveAccount,
      managerFeeAccount: blaze.feesDepot,
      stakePoolTokenMint: blaze.bsolMint,
      sysvarClock: web3_js_1.SYSVAR_CLOCK_PUBKEY,
      nativeStakeProgram: web3_js_1.StakeProgram.programId,
      stakePoolProgram: constants_1.STAKE_POOL_PROGRAM_ID,
      tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    };
    return program.methods
      .splWithdrawStake(amount)
      .accounts(accounts)
      .transaction();
  });
exports.blazeWithdrawStake = blazeWithdrawStake;
