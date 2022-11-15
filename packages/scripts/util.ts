import os from "os";

export const idWallet = os.homedir() + "/.config/solana/id.json";

process.env.ANCHOR_PROVIDER_URL =
  process.env.ANCHOR_PROVIDER_URL ?? "http://localhost:8899";
process.env.ANCHOR_WALLET = process.env.ANCHOR_WALLET ?? idWallet;
