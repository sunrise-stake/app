/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SunriseStakeClient } from "@sunrisestake/app/src/lib/client";
import { getMetadataAddress, metadata, provider, uploadMetadata } from "./util";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/stakeAccount";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { findGSolMintAuthority } from "@sunrisestake/app/src/lib/client/util";

(async () => {
  const uri = await uploadMetadata();

  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);

  const [gsolMintAuthority] = findGSolMintAuthority(client.config!);
  console.log("gsol mint auth", gsolMintAuthority);

  const sunriseStakeState = await client.program.account.state.fetch(
    client.stateAddress
  );

  const metadataAddress = getMetadataAddress(sunriseStakeState.gsolMint);

  const transactionSignature = await client.program.methods
    .createMetadata(uri, metadata.name, metadata.symbol)
    .accounts({
      state: client.stateAddress,
      marinadeState: client.marinade!.config.marinadeStateAddress,
      gsolMint: sunriseStakeState.gsolMint,
      gsolMintAuthority,
      updateAuthority: sunriseStakeState.updateAuthority, // should be equal to the one who is running the script?
      tokenProgram: TOKEN_PROGRAM_ID,
      metadata: metadataAddress,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .rpc();

  console.log(transactionSignature);
})().catch(console.error);
