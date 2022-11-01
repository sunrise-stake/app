import os from "os";
import {clusterApiUrl} from "@solana/web3.js";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL = process.env.ANCHOR_PROVIDER_URL
    // || clusterApiUrl('devnet')
    || "http://localhost:8899";
process.env.ANCHOR_WALLET = process.env.ANCHOR_WALLET || idWallet;