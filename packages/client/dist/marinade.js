"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerRebalance = exports.orders = exports.liquidUnstake = exports.depositStakeAccount = exports.deposit = void 0;
const web3_js_1 = require("@solana/web3.js");
const util_1 = require("./util");
const marinade_ts_sdk_1 = require("@sunrisestake/marinade-ts-sdk");
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const bn_js_1 = __importDefault(require("bn.js"));
const deposit = (config, program, marinade, marinadeState, stateAddress, staker, stakerGsolTokenAccount, lamports) => __awaiter(void 0, void 0, void 0, function* () {
    const sunriseStakeState = yield program.account.state.fetch(stateAddress);
    const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
    const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(config);
    const msolTokenAccountAuthority = (0, util_1.findMSolTokenAccountAuthority)(config)[0];
    const msolAssociatedTokenAccountAddress = yield anchor_1.utils.token.associatedAddress({
        mint: marinadeState.mSolMintAddress,
        owner: msolTokenAccountAuthority,
    });
    const liqPoolAssociatedTokenAccountAddress = yield anchor_1.utils.token.associatedAddress({
        mint: marinadeState.lpMint.address,
        owner: msolTokenAccountAuthority,
    });
    const accounts = {
        state: stateAddress,
        marinadeState: marinadeState.marinadeStateAddress,
        gsolMint: sunriseStakeState.gsolMint,
        gsolMintAuthority,
        msolMint: marinadeState.mSolMint.address,
        liqPoolMint: marinadeState.lpMint.address,
        liqPoolSolLegPda: yield marinadeState.solLeg(),
        liqPoolMsolLeg: marinadeState.mSolLeg,
        liqPoolMsolLegAuthority: yield marinadeState.mSolLegAuthority(),
        liqPoolMintAuthority: yield marinadeState.lpMintAuthority(),
        reservePda: yield marinadeState.reserveAddress(),
        transferFrom: staker,
        mintMsolTo: msolAssociatedTokenAccountAddress,
        mintLiqPoolTo: liqPoolAssociatedTokenAccountAddress,
        mintGsolTo: stakerGsolTokenAccount,
        msolMintAuthority: yield marinadeState.mSolMintAuthority(),
        msolTokenAccountAuthority,
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        marinadeProgram,
    };
    return program.methods.deposit(lamports).accounts(accounts).transaction();
});
exports.deposit = deposit;
const depositStakeAccount = (config, program, marinade, marinadeState, staker, stakeAccountAddress, stakerGsolTokenAccount) => __awaiter(void 0, void 0, void 0, function* () {
    const stateAddress = config.stateAddress;
    const sunriseStakeState = yield program.account.state.fetch(stateAddress);
    const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
    const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(config);
    const msolTokenAccountAuthority = (0, util_1.findMSolTokenAccountAuthority)(config)[0];
    const msolAssociatedTokenAccountAddress = yield anchor_1.utils.token.associatedAddress({
        mint: marinadeState.mSolMintAddress,
        owner: msolTokenAccountAuthority,
    });
    const stakeAccountInfo = yield marinade_ts_sdk_1.MarinadeUtils.getParsedStakeAccountInfo(marinade.provider, stakeAccountAddress);
    const voterAddress = stakeAccountInfo.voterAddress;
    if (!voterAddress) {
        throw new Error("The stake account must be delegated");
    }
    console.log("voterAddress: ", voterAddress);
    console.log("validator list: ", marinadeState.state.validatorSystem.validatorList.account.toString());
    console.log("stake list: ", marinadeState.state.stakeSystem.stakeList.account.toString());
    console.log("duplication flag: ", yield (yield marinadeState.validatorDuplicationFlag(voterAddress)).toString());
    const validatorSystem = marinadeState.state.validatorSystem;
    const stakeSystem = marinadeState.state.stakeSystem;
    const accounts = {
        state: stateAddress,
        marinadeState: marinadeState.marinadeStateAddress,
        gsolMint: sunriseStakeState.gsolMint,
        gsolMintAuthority,
        validatorList: validatorSystem.validatorList.account,
        stakeList: stakeSystem.stakeList.account,
        stakeAccount: stakeAccountAddress,
        duplicationFlag: yield marinadeState.validatorDuplicationFlag(voterAddress),
        stakeAuthority: staker,
        msolMint: marinadeState.mSolMint.address,
        mintMsolTo: msolAssociatedTokenAccountAddress,
        mintGsolTo: stakerGsolTokenAccount,
        msolMintAuthority: yield marinadeState.mSolMintAuthority(),
        msolTokenAccountAuthority,
        clock: web3_js_1.SYSVAR_CLOCK_PUBKEY,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        stakeProgram: web3_js_1.StakeProgram.programId,
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        marinadeProgram,
    };
    console.log("accounts: ", accounts);
    console.log("Getting validator index");
    const validatorIndex = yield (0, util_1.getValidatorIndex)(marinadeState, voterAddress);
    return program.methods
        .depositStakeAccount(validatorIndex)
        .accounts(accounts)
        .transaction();
});
exports.depositStakeAccount = depositStakeAccount;
const getOrderUnstakeTicketManagementAccount = (config, program, epoch) => __awaiter(void 0, void 0, void 0, function* () {
    const [address, bump] = (0, util_1.findOrderUnstakeTicketManagementAccount)(config, epoch);
    const account = yield program.account.orderUnstakeTicketManagementAccount.fetchNullable(address);
    return {
        address,
        bump,
        account,
    };
});
// TODO move this into the client to avoid having to pass in so many things?
const liquidUnstake = (config, marinade, marinadeState, program, stateAddress, staker, stakerGsolTokenAccount, lamports) => __awaiter(void 0, void 0, void 0, function* () {
    const sunriseStakeState = yield program.account.state.fetch(stateAddress);
    const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
    const [gsolMintAuthority] = (0, util_1.findGSolMintAuthority)(config);
    const msolTokenAccountAuthority = (0, util_1.findMSolTokenAccountAuthority)(config)[0];
    const msolAssociatedTokenAccountAddress = yield anchor_1.utils.token.associatedAddress({
        mint: marinadeState.mSolMintAddress,
        owner: msolTokenAccountAuthority,
    });
    // use the same token authority PDA for the msol token account
    // and the liquidity pool token account for convenience
    const liqPoolAssociatedTokenAccountAddress = yield anchor_1.utils.token.associatedAddress({
        mint: marinadeState.lpMint.address,
        owner: msolTokenAccountAuthority,
    });
    const accounts = {
        state: stateAddress,
        marinadeState: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.mSolMint.address,
        liqPoolMint: marinadeState.lpMint.address,
        gsolMint: sunriseStakeState.gsolMint,
        gsolMintAuthority,
        liqPoolSolLegPda: yield marinadeState.solLeg(),
        liqPoolMsolLeg: marinadeState.mSolLeg,
        liqPoolMsolLegAuthority: yield marinadeState.mSolLegAuthority(),
        treasuryMsolAccount: marinadeState.treasuryMsolAccount,
        getMsolFrom: msolAssociatedTokenAccountAddress,
        getMsolFromAuthority: msolTokenAccountAuthority,
        getLiqPoolTokenFrom: liqPoolAssociatedTokenAccountAddress,
        gsolTokenAccount: stakerGsolTokenAccount,
        gsolTokenAccountAuthority: staker,
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        marinadeProgram,
    };
    const { instruction: rebalanceInstruction } = yield (0, exports.triggerRebalance)(config, marinade, marinadeState, program, stateAddress, staker);
    return program.methods
        .liquidUnstake(lamports)
        .accounts(accounts)
        .postInstructions([rebalanceInstruction])
        .transaction();
});
exports.liquidUnstake = liquidUnstake;
const orders = (config, program, epoch) => __awaiter(void 0, void 0, void 0, function* () {
    const managementAccount = yield getOrderUnstakeTicketManagementAccount(config, program, epoch);
    const tickets = managementAccount.account
        ? yield (0, util_1.findAllTickets)(program.provider.connection, config, managementAccount.account, epoch)
        : [];
    return {
        managementAccount,
        tickets,
    };
});
exports.orders = orders;
const triggerRebalance = (config, marinade, marinadeState, program, stateAddress, payer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const sunriseStakeState = yield program.account.state.fetch(stateAddress);
    const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
    const msolTokenAccountAuthority = (0, util_1.findMSolTokenAccountAuthority)(config)[0];
    const msolAssociatedTokenAccountAddress = yield anchor_1.utils.token.associatedAddress({
        mint: marinadeState.mSolMintAddress,
        owner: msolTokenAccountAuthority,
    });
    const liqPoolAssociatedTokenAccountAddress = yield anchor_1.utils.token.associatedAddress({
        mint: marinadeState.lpMint.address,
        owner: msolTokenAccountAuthority,
    });
    // TODO Add instruction to close an arbitrary ticket, in case an epoch gets missed
    const epochInfo = yield program.provider.connection.getEpochInfo();
    const { managementAccount } = yield (0, exports.orders)(config, program, BigInt(epochInfo.epoch));
    const { managementAccount: previousManagementAccount, tickets: previousEpochTickets, } = yield (0, exports.orders)(config, program, BigInt(epochInfo.epoch - 1));
    const previousEpochTicketAccountMetas = previousEpochTickets.map((ticket) => ({
        pubkey: ticket,
        isSigner: false,
        isWritable: true,
    }));
    // TODO add check to see if rebalancing is needed
    // TODO Split rebalancing (order unstake) and claiming tickets - claiming tickets can be one instruction each
    // no need for remaining accounts etc.
    // Then the client bundles them together. However, this means the client will not be guaranteed to do a rebalancing
    // which costs a bit of rent.
    // TODO incrementing on the client side like this will cause clashes in future, we need to replace it
    const index = ((_b = (_a = managementAccount === null || managementAccount === void 0 ? void 0 : managementAccount.account) === null || _a === void 0 ? void 0 : _a.tickets.toNumber()) !== null && _b !== void 0 ? _b : 0) + 1;
    const [orderUnstakeTicketAccount, orderUnstakeTicketAccountBump] = (0, util_1.findOrderUnstakeTicketAccount)(config, BigInt(epochInfo.epoch), BigInt(index));
    const accounts = {
        state: stateAddress,
        payer,
        marinadeState: marinadeState.marinadeStateAddress,
        gsolMint: sunriseStakeState.gsolMint,
        msolMint: marinadeState.mSolMint.address,
        liqPoolMint: marinadeState.lpMint.address,
        liqPoolSolLegPda: yield marinadeState.solLeg(),
        liqPoolMsolLeg: marinadeState.mSolLeg,
        liqPoolMsolLegAuthority: yield marinadeState.mSolLegAuthority(),
        liqPoolMintAuthority: yield marinadeState.lpMintAuthority(),
        liqPoolTokenAccount: liqPoolAssociatedTokenAccountAddress,
        reservePda: yield marinadeState.reserveAddress(),
        treasuryMsolAccount: marinadeState.treasuryMsolAccount,
        getMsolFrom: msolAssociatedTokenAccountAddress,
        getMsolFromAuthority: msolTokenAccountAuthority,
        orderUnstakeTicketAccount,
        orderUnstakeTicketManagementAccount: managementAccount.address,
        // Utilising the new "optional named accounts" feature in Anchor 0.26.0
        // to pass this only if it exists.
        // Since this passes null instead of the address, what is to stop the client from "lying"?
        // Well, nothing in the general case, but in this case, it is in the caller's interest to pass the account,
        // as it allows them to claim rent on closure of this account and the tickets.
        previousOrderUnstakeTicketManagementAccount: previousManagementAccount.account
            ? previousManagementAccount.address
            : null,
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        clock: web3_js_1.SYSVAR_CLOCK_PUBKEY,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        marinadeProgram,
    };
    const instruction = yield program.methods
        .triggerPoolRebalance(new bn_js_1.default(epochInfo.epoch), new bn_js_1.default(index), orderUnstakeTicketAccountBump, previousManagementAccount.bump)
        .accounts(accounts)
        .remainingAccounts(previousEpochTicketAccountMetas)
        .instruction();
    return {
        instruction,
        orderUnstakeTicketAccount,
        managementAccount: managementAccount.address,
        previousManagementAccount: managementAccount.address,
    };
});
exports.triggerRebalance = triggerRebalance;
