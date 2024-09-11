import os from "os";
import {Cluster, clusterApiUrl, PublicKey} from "@solana/web3.js";
import {AnchorProvider} from "@coral-xyz/anchor";
import {Environment} from "@sunrisestake/client";
import BN, {isBN} from "bn.js";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL =
  process.env.ANCHOR_PROVIDER_URL ?? clusterApiUrl((process.env.REACT_APP_SOLANA_NETWORK  || 'devnet') as Cluster);
process.env.ANCHOR_WALLET = process.env.ANCHOR_WALLET ?? idWallet;

export const readOnlyProvider = (publicKey: PublicKey): AnchorProvider => {
    const envProvider = AnchorProvider.env();
    return new AnchorProvider(
        envProvider.connection,
        {
            publicKey,
            signTransaction: () => Promise.reject(new Error("Read-only wallet")),
            signAllTransactions: () => Promise.reject(new Error("Read-only wallet")),
        },
        envProvider.opts,
    );
}

export const recursiveToString = (json: any, result: any = {}) => {
    for (const key in json) {
        // if the object has a toString method (not inherited on its prototype), use it
        if (json[key] && json[key].toString && json[key].toString !== Object.prototype.toString) {
            result[key] = json[key].toString();
        } else if (json[key] instanceof PublicKey) {
            result[key] = json[key].toBase58();
        } else if (isBN(json[key])) {
            result[key] = new BN(json[key]).toString();
        } else if (Array.isArray(json[key])) {
            result[key] = json[key].map(recursiveToString);
        } else if (typeof json[key] === "object") {
            result[key] = recursiveToString(json[key]);
        } else {
            result[key] = json[key];
        }
    }

    return result;
}

export const SUNRISE_STAKE_STATE = Environment["mainnet-beta"];
