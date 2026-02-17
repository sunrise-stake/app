import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import BN from "bn.js";

/**
 * Move SOL from SPL stake pool (liquid reserve) directly to Marinade liquidity pool.
 * This is an admin-only operation for rebalancing funds between pools.
 *
 * This operation withdraws SOL from the SPL stake pool's liquid reserve and immediately
 * adds it to the Marinade liquidity pool. It does not require waiting for stake deactivation.
 *
 * Usage:
 *   yarn workspace @sunrisestake/scripts run ts-node moveSplLiquidToMarinade.ts <lamports>
 *
 * Example:
 *   yarn workspace @sunrisestake/scripts run ts-node moveSplLiquidToMarinade.ts 1000000000
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

  const lamports = parseInt(process.argv[2], 10);

  if (isNaN(lamports)) {
    console.error("Usage: ts-node moveSplLiquidToMarinade.ts <lamports>");
    console.error("  lamports: The amount of lamports to move from SPL pool to Marinade liquidity pool");
    console.error("\nExample: ts-node moveSplLiquidToMarinade.ts 1000000000 (1 SOL)");
    process.exit(1);
  }

  console.log(`Moving ${lamports / 1e9} SOL from SPL stake pool to Marinade liquidity pool...`);

  const transaction = await client.moveSplLiquidToMarinade(new BN(lamports));

  const txSig = await client.sendAndConfirmTransaction(transaction, []);

  console.log("Transaction signature:", txSig);
  console.log(`\nSuccessfully moved ${lamports / 1e9} SOL to Marinade liquidity pool.`);
})().catch(console.error);
