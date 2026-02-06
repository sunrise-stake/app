import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

/**
 * Deposit a deactivated stake account (from SPL rebalancing) into Marinade liquidity pool.
 * This is an admin-only operation. The stake account must be fully deactivated (wait for next epoch).
 *
 * Usage:
 *   yarn workspace @sunrisestake/scripts run ts-node depositSplStakeToLiquid.ts <index>
 *
 * Example:
 *   yarn workspace @sunrisestake/scripts run ts-node depositSplStakeToLiquid.ts 0
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

  const index = parseInt(process.argv[2], 10);

  if (isNaN(index)) {
    console.error("Usage: ts-node depositSplStakeToLiquid.ts <index>");
    console.error("  index: The index of the stake account PDA to deposit");
    console.error("\nExample: ts-node depositSplStakeToLiquid.ts 0");
    console.error("\nRun 'splRebalanceReport.ts' first to see available stake accounts.");
    process.exit(1);
  }

  console.log(`Depositing SPL stake account ${index} to Marinade liquidity pool...`);

  // First check if the stake account exists and is deactivated
  const accounts = await client.findSplRebalanceStakeAccounts(index + 1);
  const account = accounts.find(a => a.index === BigInt(index));

  if (!account) {
    console.error(`Stake account with index ${index} not found.`);
    console.error("Run 'splRebalanceReport.ts' to see available stake accounts.");
    process.exit(1);
  }

  if (account.state !== "deactivated") {
    console.error(`Stake account with index ${index} is not fully deactivated yet.`);
    console.error(`Current state: ${account.state}`);
    if (account.deactivationEpoch !== undefined) {
      console.error(`Deactivation epoch: ${account.deactivationEpoch}`);
    }
    console.error("Wait until the next epoch boundary for full deactivation.");
    process.exit(1);
  }

  console.log(`Stake account balance: ${(account.lamports / 1e9).toFixed(4)} SOL`);

  const transaction = await client.depositSplStakeToLiquid(BigInt(index));

  const txSig = await client.sendAndConfirmTransaction(transaction, []);

  console.log("Transaction signature:", txSig);
  console.log(`\nSuccessfully deposited ${(account.lamports / 1e9).toFixed(4)} SOL to Marinade liquidity pool.`);
})().catch(console.error);
