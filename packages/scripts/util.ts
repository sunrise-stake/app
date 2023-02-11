import os from "os";
import { Cluster, clusterApiUrl } from "@solana/web3.js";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL =
  process.env.ANCHOR_PROVIDER_URL ??
  (process.env.REACT_APP_SOLANA_NETWORK !== undefined
    ? clusterApiUrl(process.env.REACT_APP_SOLANA_NETWORK as Cluster)
    : "http://localhost:8899");
process.env.ANCHOR_WALLET = process.env.ANCHOR_WALLET ?? idWallet;
