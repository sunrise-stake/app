/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "../util";
import { SunriseStakeClient } from "../../client/src/index.js";
import { getMetadataAddress, metadata, provider, uploadMetadata } from "./util";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {findGSolMintAuthority} from "../../client/src/util";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

console.log("Updating gSol metadata");

(async () => {
  const uri = await uploadMetadata();

  const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet');

  const [gsolMintAuthority] = findGSolMintAuthority(client.config!);
  console.log("gsol mint auth", gsolMintAuthority);

  const sunriseStakeState = await client.program.account.state.fetch(
    client.config!.stateAddress
  );

  const metadataAddress = getMetadataAddress(sunriseStakeState.gsolMint);

  const transactionSignature = await client.program.methods
    .updateMetadata(uri, metadata.name, metadata.symbol)
    .accounts({
      state: client.config!.stateAddress,
      marinadeState: client.marinade!.config.marinadeStateAddress,
      gsolMint: sunriseStakeState.gsolMint,
      gsolMintAuthority,
      updateAuthority: sunriseStakeState.updateAuthority, // should be equal to the one who is running the script?
      metadata: metadataAddress,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .rpc();

  console.log(transactionSignature);
})().catch(console.error);
