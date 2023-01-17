import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/stakeAccount";
import { AnchorProvider, setProvider } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import * as fs from "fs";
import { findGSolMintAuthority } from "@sunrisestake/app/src/lib/client/util";

const name = "Sunrise gSOL";
const description = "Sunrise Stake Green SOL Token";
const symbol = "GSOL";
const imageFile = "gSOL.png";

async function airdropSolIfNeeded(
  signer: Keypair,
  connection: Connection
): Promise<void> {
  const balance = await connection.getBalance(signer.publicKey);
  console.log("Current balance is", balance / LAMPORTS_PER_SOL);

  if (balance < LAMPORTS_PER_SOL) {
    console.log("Airdropping 1 SOL...");
    const airdropSignature = await connection.requestAirdrop(
      signer.publicKey,
      LAMPORTS_PER_SOL
    );

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature,
    });

    const newBalance = await connection.getBalance(signer.publicKey);
    console.log("New balance is", newBalance / LAMPORTS_PER_SOL);
  }
}

console.log("Creating gSol metadata");

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"));

  // This will be the payer of creating the metadata account
  // TODO: Change this to be the keypair of update authority
  const keypair = new Keypair();
  const wallet = new NodeWallet(keypair);
  await airdropSolIfNeeded(wallet.payer, connection);

  const metaplex = Metaplex.make(connection)
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

  const provider = new AnchorProvider(connection, wallet, {});
  setProvider(provider);

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
      gsolMintAuthority: gsolMintAuthority,
      updateAuthority: sunriseStakeState.updateAuthority,
      tokenProgram: TOKEN_PROGRAM_ID,
      metadata: metadataAddress,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .rpc();

  console.log(transactionSignature);

  const balance = await connection.getBalance(wallet.publicKey);
  console.log("Current balance is", balance / LAMPORTS_PER_SOL);
})().catch(console.error);
