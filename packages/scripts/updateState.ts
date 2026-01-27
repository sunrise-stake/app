import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

// Known treasury addresses:
// dev: GRrWR48gthj53CpmdvThjh3Nh5XtjNJLsxqdKtNpJyDp
// prod old treasury (Yield Controller): E7BjB9UQp814RsMPq7U6S4fy6wRzn6tFTYt31kJoskoq
// prod new treasury (Offset Bridge): 6HQrvpMJFqMj35JqMReyhnUrRXNucAAB6FywdDu7xPKA
// devnet new treasury (Yield Router): Csr9LRZ4K2kYWHeHrvTJZYqA55jNSDhxtszJT3yRicQS

const parseArgs = () => {
  const updates: {
    newTreasury?: PublicKey;
    newliqPoolProportion?: number;
    newliqPoolMinProportion?: number;
  } = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const nextArg = process.argv[i + 1];

    if (arg === "--liqPoolProportion" && nextArg) {
      updates.newliqPoolProportion = parseInt(nextArg, 10);
      i++;
    } else if (arg === "--liqPoolMinProportion" && nextArg) {
      updates.newliqPoolMinProportion = parseInt(nextArg, 10);
      i++;
    } else if (arg === "--treasury" && nextArg) {
      updates.newTreasury = new PublicKey(nextArg);
      i++;
    }
  }

  return updates;
};

(async () => {
  const updates = parseArgs();

  if (Object.keys(updates).length === 0) {
    console.log("Usage: updateState.ts [options]");
    console.log("Options:");
    console.log("  --liqPoolProportion <0-100>     Target LP proportion");
    console.log("  --liqPoolMinProportion <0-100>  Minimum LP proportion");
    console.log("  --treasury <pubkey>             Treasury address");
    process.exit(1);
  }

  console.log("Updating state with:", updates);

  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(
      provider,
      process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork || 'devnet',
      {
        verbose: true,
      });
  await client.update(updates);

  console.log("State updated successfully");
})().catch(console.error);
