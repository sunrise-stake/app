/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "../util.js";
import { SunriseStakeClient } from "../../client/src/index.js";
import { getMetadataAddress, metadata, provider, uploadMetadata } from "./util.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { findGSolMintAuthority } from "../../client/src/util.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

(async () => {
  const client = await SunriseStakeClient.get(
      provider,
      (process.env.REACT_APP_SOLANA_NETWORK || 'devnet') as WalletAdapterNetwork,
  );

  const [gsolMintAuthority] = findGSolMintAuthority(client.config!);
  console.log("gsol mint auth", gsolMintAuthority);

  const metadataAddress = getMetadataAddress(client.config!.gsolMint);

  const accounts = {
    state: client.env.state,
    marinadeState: client.marinade!.config.marinadeStateAddress,
    gsolMint: client.config!.gsolMint,
    gsolMintAuthority,
    updateAuthority: client.config!.updateAuthority, // should be equal to the one who is running the script?
    tokenProgram: TOKEN_PROGRAM_ID,
    metadata: metadataAddress,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  };

  console.log("accounts", accounts);

  const uri = await uploadMetadata();
  console.log("uri", uri);
  const transactionSignature = await client.program.methods
    .createMetadata(uri, metadata.name, metadata.symbol)
    .accounts(accounts)
    .rpc();

  console.log(transactionSignature);
})().catch(console.error);
