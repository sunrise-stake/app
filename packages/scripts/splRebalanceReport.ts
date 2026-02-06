import { SunriseStakeClient, toSol } from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

/**
 * Report on SPL rebalance stake accounts.
 *
 * Usage:
 *   yarn workspace @sunrisestake/scripts run ts-node splRebalanceReport.ts
 */
(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(
    provider,
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) || "devnet",
    {
      verbose: true,
    }
  );

  console.log("Finding SPL rebalance stake accounts...\n");

  const accounts = await client.findSplRebalanceStakeAccounts(50);

  if (accounts.length === 0) {
    console.log("No SPL rebalance stake accounts found.");
  } else {
    console.log(`Found ${accounts.length} SPL rebalance stake accounts:\n`);

    let totalLamports = 0;
    let deactivatedLamports = 0;

    for (const account of accounts) {
      const solAmount = account.lamports / 1e9;
      totalLamports += account.lamports;

      if (account.state === "deactivated") {
        deactivatedLamports += account.lamports;
      }

      console.log(`Index ${account.index}:`);
      console.log(`  Address: ${account.address.toBase58()}`);
      console.log(`  Balance: ${solAmount.toFixed(4)} SOL`);
      console.log(`  State: ${account.state}`);
      if (account.deactivationEpoch !== undefined) {
        console.log(`  Deactivation Epoch: ${account.deactivationEpoch}`);
      }
      console.log();
    }

    console.log("Summary:");
    console.log(`  Total accounts: ${accounts.length}`);
    console.log(`  Total balance: ${(totalLamports / 1e9).toFixed(4)} SOL`);
    console.log(`  Deactivated balance: ${(deactivatedLamports / 1e9).toFixed(4)} SOL`);

    const deactivatedAccounts = accounts.filter(a => a.state === "deactivated");
    if (deactivatedAccounts.length > 0) {
      console.log(`\n  Ready to deposit to liquidity pool (deactivated accounts): ${deactivatedAccounts.length}`);
      for (const account of deactivatedAccounts) {
        console.log(`    - Index ${account.index}: ${(account.lamports / 1e9).toFixed(4)} SOL`);
      }
    }
  }
})().catch(console.error);
