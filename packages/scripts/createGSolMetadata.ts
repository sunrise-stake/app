import { SunriseStakeClient } from "@sunrisestake/app/src/lib/client";
import "./util";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/stakeAccount";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import * as fs from "fs";
import { findGSolMintAuthority } from "@sunrisestake/app/src/lib/client/util";
import { AnchorProvider } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import os from "os";

const name = "Sunrise gSOL";
const description = "Sunrise Stake Green SOL Token";
const symbol = "GSOL";
const imageFile = "gSOL.png";

const keypair = Keypair.fromSecretKey(
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Buffer.from(require(os.homedir() + "/.config/solana/id.json"))
);

console.log("Creating gSol metadata");

(async () => {
  const provider = AnchorProvider.env();

  const metaplex = Metaplex.make(provider.connection)
    .use(keypairIdentity(keypair))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  // Upload image and get image uri
  const buffer = fs.readFileSync("packages/app/public/" + imageFile);
  const file = toMetaplexFile(buffer, imageFile);

  const imageUri = await metaplex.storage().upload(file);
  console.log("image uri: ", imageUri);

  // Upload metadata and get metadata uri
  const { uri } = await metaplex.nfts().uploadMetadata({
    name,
    description,
    imageUri,
    symbol,
  });
  console.log("metadata uri:", uri);

  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);

  if (
    !client.marinadeState ||
    !client.marinade ||
    !client.config ||
    !client.stakerGSolTokenAccount
  )
    throw new Error("init not called");

  // eslint-disable-next-line
    const [gsolMintAuthority] = findGSolMintAuthority(client.config);
  console.log("gsol mint auth", gsolMintAuthority);

  const sunriseStakeState = await client.program.account.state.fetch(
    client.stateAddress
  );

  const metadataAddress = (
    await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        sunriseStakeState.gsolMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];

  const transactionSignature = await client.program.methods
    .createMetadata(uri, name, symbol)
    .accounts({
      state: client.stateAddress,
      marinadeState: client.marinade.config.marinadeStateAddress,
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
