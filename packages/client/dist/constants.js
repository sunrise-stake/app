"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINIMUM_EXTRACTABLE_YIELD = exports.NETWORK_FEE = exports.MARINADE_TICKET_RENT = exports.DEFAULT_LP_MIN_PROPORTION = exports.DEFAULT_LP_PROPORTION = exports.HOLDING_ACCOUNT = exports.SUNRISE_STAKE_STATE = exports.SOLBLAZE_CONFIG = exports.SolBlazeEnvironment = exports.Environment = exports.STAKE_POOL_PROGRAM_ID = void 0;
const wallet_adapter_base_1 = require("@solana/wallet-adapter-base");
const web3_js_1 = require("@solana/web3.js");
exports.STAKE_POOL_PROGRAM_ID = new web3_js_1.PublicKey("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");
exports.Environment = {
    "mainnet-beta": {
        state: new web3_js_1.PublicKey("43m66crxGfXSJpmx5wXRoFuHubhHA1GCvtHgmHW6cM1P"),
        holdingAccount: new web3_js_1.PublicKey("shcFT8Ur2mzpX61uWQRL9KyERZp4w2ehDEvA7iaAthn"),
    },
    testnet: {
        state: new web3_js_1.PublicKey("DR3hrjH6SZefraRu8vaQfEhG5e6E25ZwccakQxWRePkC"),
        holdingAccount: new web3_js_1.PublicKey("dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD"), // TODO incorrect
    },
    devnet: {
        state: new web3_js_1.PublicKey("Jpp29FzyV7rXdVRWFaiE9tBcVCaEMvj16gk87rC3S4z"),
        holdingAccount: new web3_js_1.PublicKey("dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD"),
    },
};
exports.SolBlazeEnvironment = {
    "mainnet-beta": {
        pool: new web3_js_1.PublicKey("stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"),
        bsolMint: new web3_js_1.PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
    },
    devnet: {
        pool: new web3_js_1.PublicKey("azFVdHtAJN8BX3sbGAYkXvtdjdrT5U6rj9rovvUFos9"),
        bsolMint: new web3_js_1.PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
    },
    testnet: {
        pool: web3_js_1.PublicKey.default,
        bsolMint: web3_js_1.PublicKey.default,
    },
};
exports.SOLBLAZE_CONFIG = exports.SolBlazeEnvironment[process.env.REACT_APP_SOLANA_NETWORK ||
    wallet_adapter_base_1.WalletAdapterNetwork.Devnet];
exports.SUNRISE_STAKE_STATE = exports.Environment[process.env.REACT_APP_SOLANA_NETWORK ||
    wallet_adapter_base_1.WalletAdapterNetwork.Devnet].state;
exports.HOLDING_ACCOUNT = exports.Environment[process.env.REACT_APP_SOLANA_NETWORK ||
    wallet_adapter_base_1.WalletAdapterNetwork.Devnet].holdingAccount;
exports.DEFAULT_LP_PROPORTION = 10;
exports.DEFAULT_LP_MIN_PROPORTION = 5;
exports.MARINADE_TICKET_RENT = 1503360;
exports.NETWORK_FEE = 5000;
exports.MINIMUM_EXTRACTABLE_YIELD = 100000000; // 0.1 SOL
