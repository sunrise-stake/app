/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {Environment, SunriseStakeClient} from "../client/src/index.js";
import { Transaction } from "@solana/web3.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";

// Used to create the LP token account for a given sunrise instance
// Only needed to upgrade legacy instances created before this was added in register_state

// Usage: ANCHOR_PROVIDER_URL=https://api.devnet.solana.com REACT_APP_SOLANA_NETWORK=devnet yarn ts-node packages/scripts/createLPTokenAccount.ts

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(
    provider,
    process.env.REACT_APP_SOLANA_NETWORK as keyof typeof Environment
  );

  if (!client.liqPoolTokenAccount) throw new Error("No liq pool token account");

  const tokenAccount = client.liqPoolTokenAccount;

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      provider.publicKey,
      tokenAccount,
      client.msolTokenAccountAuthority!,
      client.marinadeState!.lpMint.address
    )
  );

  const txSig = await provider.sendAndConfirm(tx);

  console.log("tx sig: ", txSig);
})().catch(console.error);
