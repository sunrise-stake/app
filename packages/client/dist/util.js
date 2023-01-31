"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marinadeTargetReached = exports.getValidatorIndex = exports.getVoterAddress = exports.getStakeAccountInfo = exports.proportionalBN = exports.findAllTickets = exports.ZERO_BALANCE = exports.PROGRAM_ID = exports.setUpAnchor = exports.confirm = exports.logKeys = exports.findOrderUnstakeTicketAccount = exports.findOrderUnstakeTicketManagementAccount = exports.findGSolMintAuthority = exports.findBSolTokenAccountAuthority = exports.findMSolTokenAccountAuthority = exports.ZERO = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor = __importStar(require("@project-serum/anchor"));
const anchor_1 = require("@project-serum/anchor");
const marinade_ts_sdk_1 = require("@sunrisestake/marinade-ts-sdk");
// zero bn number
exports.ZERO = new anchor_1.BN(0);
const findProgramDerivedAddress = (config, seed, extraSeeds = []) => {
    const seeds = [
        config.stateAddress.toBuffer(),
        Buffer.from(seed),
        ...extraSeeds,
    ];
    return web3_js_1.PublicKey.findProgramAddressSync(seeds, config.programId);
};
const findMSolTokenAccountAuthority = (config) => findProgramDerivedAddress(config, "msol_account" /* ProgramDerivedAddressSeed.M_SOL_ACCOUNT */);
exports.findMSolTokenAccountAuthority = findMSolTokenAccountAuthority;
const findBSolTokenAccountAuthority = (config) => findProgramDerivedAddress(config, "bsol_account" /* ProgramDerivedAddressSeed.B_SOL_ACCOUNT */);
exports.findBSolTokenAccountAuthority = findBSolTokenAccountAuthority;
const findGSolMintAuthority = (config) => findProgramDerivedAddress(config, "gsol_mint_authority" /* ProgramDerivedAddressSeed.G_SOL_MINT_AUTHORITY */);
exports.findGSolMintAuthority = findGSolMintAuthority;
const findOrderUnstakeTicketManagementAccount = (config, epoch) => {
    const epochBuf = Buffer.allocUnsafe(8);
    epochBuf.writeBigInt64BE(epoch);
    return findProgramDerivedAddress(config, "order_unstake_ticket_mgmt" /* ProgramDerivedAddressSeed.ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT */, [epochBuf]);
};
exports.findOrderUnstakeTicketManagementAccount = findOrderUnstakeTicketManagementAccount;
const findOrderUnstakeTicketAccount = (config, epoch, index) => {
    const epochBuf = Buffer.allocUnsafe(8);
    epochBuf.writeBigInt64BE(epoch, 0);
    const indexBuf = Buffer.allocUnsafe(8);
    indexBuf.writeBigInt64BE(index, 0);
    return findProgramDerivedAddress(config, "order_unstake_ticket_account" /* ProgramDerivedAddressSeed.ORDER_UNSTAKE_TICKET_ACCOUNT */, [epochBuf, indexBuf]);
};
exports.findOrderUnstakeTicketAccount = findOrderUnstakeTicketAccount;
const logKeys = (transaction) => transaction.instructions.forEach((instruction, j) => {
    instruction.keys.forEach((key, i) => {
        console.log(j, i, key.pubkey.toBase58());
    });
});
exports.logKeys = logKeys;
const confirm = (connection) => (txSig) => __awaiter(void 0, void 0, void 0, function* () {
    return connection.confirmTransaction(Object.assign({ signature: txSig }, (yield connection.getLatestBlockhash())));
});
exports.confirm = confirm;
const setUpAnchor = () => {
    // Configure the client to use the local cluster.
    const provider = anchor_1.AnchorProvider.env();
    anchor.setProvider(provider);
    return provider;
};
exports.setUpAnchor = setUpAnchor;
exports.PROGRAM_ID = new web3_js_1.PublicKey("sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6");
exports.ZERO_BALANCE = {
    value: {
        amount: "0",
        decimals: 9,
        uiAmount: 0,
        uiAmountString: "0",
    },
};
const findAllTickets = (connection, config, managementAccount, epoch) => __awaiter(void 0, void 0, void 0, function* () {
    // find all tickets for the last epoch in reverse order, this allows us to better paginate later
    const tickets = [];
    for (let i = managementAccount.tickets.toNumber(); i >= 0; i--) {
        const [orderUnstakeTicketAccount] = (0, exports.findOrderUnstakeTicketAccount)(config, epoch, BigInt(i));
        tickets.push(orderUnstakeTicketAccount);
    }
    // TODO Later add pagination here in case the count is too high for one call
    const accountInfos = yield connection.getMultipleAccountsInfo(tickets);
    return accountInfos
        .map((accountInfo, i) => [
        tickets[i],
        accountInfo,
    ])
        .filter((element) => element[1] !== null)
        .map(([ticket]) => ticket);
});
exports.findAllTickets = findAllTickets;
const proportionalBN = (amount, numerator, denominator) => {
    if (denominator.isZero()) {
        return amount;
    }
    const result = (BigInt(amount.toString()) * BigInt(numerator.toString())) /
        BigInt(denominator.toString());
    return new anchor_1.BN(result.toString());
};
exports.proportionalBN = proportionalBN;
const getStakeAccountInfo = (stakeAccount, anchorProvider
// program: anchor.Program<SunriseStake>,
) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new marinade_ts_sdk_1.Provider(anchorProvider.connection, anchorProvider.wallet, {});
    const parsedData = marinade_ts_sdk_1.MarinadeUtils.getParsedStakeAccountInfo(provider, stakeAccount);
    console.log("parsedData: ", parsedData);
    return parsedData;
});
exports.getStakeAccountInfo = getStakeAccountInfo;
const getVoterAddress = (stakeAccount, provider
// program: Program<SunriseStake>,
) => __awaiter(void 0, void 0, void 0, function* () {
    const info = yield (0, exports.getStakeAccountInfo)(stakeAccount, provider);
    if (!info.voterAddress) {
        throw new Error(`Stake account must be delegated`);
    }
    return info.voterAddress;
});
exports.getVoterAddress = getVoterAddress;
const getValidatorIndex = (marinadeState, voterAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const { validatorRecords } = yield marinadeState.getValidatorRecords();
    const validatorLookupIndex = validatorRecords.findIndex(({ validatorAccount }) => validatorAccount.equals(voterAddress));
    const validatorIndex = validatorLookupIndex === -1
        ? marinadeState.state.validatorSystem.validatorList.count
        : validatorLookupIndex;
    return validatorIndex;
});
exports.getValidatorIndex = getValidatorIndex;
const marinadeTargetReached = (details, percentage) => {
    const msolValue = details.mpDetails.msolValue;
    const gsolSupply = new anchor_1.BN(details.balances.gsolSupply.amount);
    const limit = (0, exports.proportionalBN)(gsolSupply, new anchor_1.BN(percentage), new anchor_1.BN(100));
    return msolValue > limit;
};
exports.marinadeTargetReached = marinadeTargetReached;
