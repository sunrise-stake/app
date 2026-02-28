import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import BN from "bn.js";

/**
 * Create a stake account from SPL stake pool and deactivate it.
 * This is an admin-only operation for rebalancing funds from SPL to Marinade liquidity pool.
 *
 * The stake account will be created and immediately deactivated. It will be fully deactivated
 * at the next epoch boundary, after which it can be deposited to the Marinade liquidity pool.
 *
 * Usage:
 *   yarn workspace @sunrisestake/scripts run ts-node createSplStakeAccount.ts <index> <lamports>
 *
 * Example:
 *   yarn workspace @sunrisestake/scripts run ts-node createSplStakeAccount.ts 0 1000000000
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
  const lamports = parseInt(process.argv[3], 10);

  if (isNaN(index) || isNaN(lamports)) {
    console.error("Usage: ts-node createSplStakeAccount.ts <index> <lamports>");
    console.error("  index: The index for the stake account PDA (0, 1, 2, ...)");
    console.error("  lamports: The amount of lamports to withdraw as stake");
    console.error("\nExample: ts-node createSplStakeAccount.ts 0 1000000000");
    process.exit(1);
  }

  console.log(`Creating SPL stake account with index ${index} for ${lamports / 1e9} SOL`);

  const transaction = await client.createSplStakeAccount(BigInt(index), new BN(lamports));

  const txSig = await client.sendAndConfirmTransaction(transaction, []);

  console.log("Transaction signature:", txSig);
  console.log(`\nStake account created and deactivating. Will be fully deactivated at next epoch boundary.`);
  console.log(`Run 'splRebalanceReport.ts' to check status.`);
})().catch(console.error);
