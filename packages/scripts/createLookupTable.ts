import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  AddressLookupTableProgram,
  PublicKey,
  sendAndConfirmTransaction,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { utils } from "@coral-xyz/anchor";
import {
  findBSolTokenAccountAuthority,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  PROGRAM_ID,
} from "../client/src/util.js";
import { STAKE_POOL_PROGRAM_ID } from "../client/src/constants.js";

/**
 * Creates an Address Lookup Table containing all static accounts used by the
 * `liquidUnstake` instruction. This reduces the on-chain transaction size by
 * allowing accounts to be referenced by a 1-byte index rather than 32-byte pubkeys.
 *
 * Usage:
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   ANCHOR_PROVIDER_URL=<rpc-url> \
 *   REACT_APP_SOLANA_NETWORK=mainnet-beta \
 *   npx tsx createLookupTable.ts
 */
(async () => {
  const provider = AnchorProvider.env();
  const network =
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) || "devnet";

  console.log("Initializing client on", network, "...");
  const client = await SunriseStakeClient.get(provider, network, {
    verbose: true,
  });

  const marinadeState = client.marinadeState;
  const blazeState = client.blazeState;
  const config = client.config;

  if (!marinadeState || !blazeState || !config) {
    throw new Error("Client not fully initialized");
  }

  const msolTokenAccountAuthority = findMSolTokenAccountAuthority(config)[0];
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const [gsolMintAuthority] = findGSolMintAuthority(config);

  const msolTokenAccount = utils.token.associatedAddress({
    mint: marinadeState.mSolMintAddress,
    owner: msolTokenAccountAuthority,
  });

  const liqPoolTokenAccount = utils.token.associatedAddress({
    mint: marinadeState.lpMint.address,
    owner: msolTokenAccountAuthority,
  });

  const bsolTokenAccount = utils.token.associatedAddress({
    mint: blazeState.bsolMint,
    owner: bsolTokenAccountAuthority,
  });

  // Collect all static addresses used in liquidUnstake.
  // Per-user addresses (gsolTokenAccount, gsolTokenAccountAuthority/signer) are excluded.
  const addresses: PublicKey[] = [
    // Sunrise state
    config.stateAddress,
    // Marinade state (resolved from state on-chain, but deterministic)
    marinadeState.marinadeStateAddress,
    // gSOL mint & authority
    config.gsolMint,
    gsolMintAuthority,
    // mSOL mint
    marinadeState.mSolMint.address,
    // LP mint
    marinadeState.lpMint.address,
    // LP sol leg PDA
    await marinadeState.solLeg(),
    // LP mSOL leg
    marinadeState.mSolLeg,
    // LP mSOL leg authority
    await marinadeState.mSolLegAuthority(),
    // Treasury mSOL account
    marinadeState.treasuryMsolAccount,
    // Sunrise mSOL token account (PDA-derived)
    msolTokenAccount,
    // mSOL token account authority (PDA)
    msolTokenAccountAuthority,
    // Sunrise LP token account (PDA-derived)
    liqPoolTokenAccount,
    // Sunrise bSOL token account (PDA-derived)
    bsolTokenAccount,
    // bSOL token account authority (PDA)
    bsolTokenAccountAuthority,
    // Blaze stake pool
    blazeState.pool,
    // Blaze withdraw authority
    blazeState.withdrawAuthority,
    // Blaze reserve stake account
    blazeState.reserveAccount,
    // Blaze manager fee account
    blazeState.feesDepot,
    // bSOL mint
    blazeState.bsolMint,
    // Sysvars
    SYSVAR_STAKE_HISTORY_PUBKEY,
    SYSVAR_CLOCK_PUBKEY,
    // Programs
    STAKE_POOL_PROGRAM_ID,
    StakeProgram.programId,
    SystemProgram.programId,
    TOKEN_PROGRAM_ID,
    PROGRAM_ID, // Sunrise program
    new PublicKey("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"), // Marinade program
  ];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueAddresses = addresses.filter((addr) => {
    const key = addr.toBase58();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(
    `Collected ${uniqueAddresses.length} unique static addresses for ALT`
  );
  for (const addr of uniqueAddresses) {
    console.log("  ", addr.toBase58());
  }

  // Step 1: Create the lookup table
  const slot = await provider.connection.getSlot();
  const [createIx, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: provider.publicKey,
      payer: provider.publicKey,
      recentSlot: slot,
    });

  console.log("\nCreating Address Lookup Table...");
  const createTx = new Transaction().add(createIx);
  const createSig = await sendAndConfirmTransaction(
    provider.connection,
    createTx,
    [(provider.wallet as any).payer]
  );
  console.log("Create tx:", createSig);
  console.log("Lookup Table Address:", lookupTableAddress.toBase58());

  // Step 2: Extend the table with addresses (max 30 per extend call)
  const BATCH_SIZE = 30;
  for (let i = 0; i < uniqueAddresses.length; i += BATCH_SIZE) {
    const batch = uniqueAddresses.slice(i, i + BATCH_SIZE);
    const extendIx = AddressLookupTableProgram.extendLookupTable({
      payer: provider.publicKey,
      authority: provider.publicKey,
      lookupTable: lookupTableAddress,
      addresses: batch,
    });

    console.log(
      `\nExtending ALT with addresses ${i + 1}-${i + batch.length}...`
    );
    const extendTx = new Transaction().add(extendIx);
    const extendSig = await sendAndConfirmTransaction(
      provider.connection,
      extendTx,
      [(provider.wallet as any).payer]
    );
    console.log("Extend tx:", extendSig);
  }

  console.log("\n=== Done ===");
  console.log("Lookup Table Address:", lookupTableAddress.toBase58());
  console.log(
    "\nAdd this to the environment config in packages/client/src/constants.ts:"
  );
  console.log(
    `  lookupTableAddress: new PublicKey("${lookupTableAddress.toBase58()}"),`
  );
  console.log(
    "\nNote: The ALT needs ~1 slot to become active before it can be used in transactions."
  );
})().catch(console.error);
