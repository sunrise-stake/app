import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

// const newliqPoolProportion = parseInt(process.argv[2], 10);
//
// console.log("Setting new LP Proportion to", newliqPoolProportion);

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(
      provider,
      process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork || 'devnet',
      {
        verbose: true,
      });
  await client.update({
      // dev
      // newTreasury: new PublicKey("GRrWR48gthj53CpmdvThjh3Nh5XtjNJLsxqdKtNpJyDp"),
      // prod old treasury (Yield Controller)
    // newTreasury: new PublicKey("E7BjB9UQp814RsMPq7U6S4fy6wRzn6tFTYt31kJoskoq"),
      // prod new treasury (Offset Bridge)
      // newTreasury: new PublicKey("6HQrvpMJFqMj35JqMReyhnUrRXNucAAB6FywdDu7xPKA"),
      // devnet new treasury (Yield Router)
      newTreasury: new PublicKey("Csr9LRZ4K2kYWHeHrvTJZYqA55jNSDhxtszJT3yRicQS"),
  });
})().catch(console.error);
