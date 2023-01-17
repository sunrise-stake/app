import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/stakeAccount";
import { AnchorProvider, setProvider } from "@project-serum/anchor";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import * as fs from "fs";
import { findGSolMintAuthority } from "@sunrisestake/app/src/lib/client/util";

const tokenName = "Sunrise gSOL";
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

console.log("Updating gSol metadata");

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"));

  // This will be the payer of creating the metadata account
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
    name: tokenName,
    description,
    imageUri,
    symbol,
  });
  console.log("metadata uri:", uri);

  const provider = new AnchorProvider(connection, wallet, {});
  setProvider(provider);

  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);

  // eslint-disable-next-line
  const [gsolMintAuthority] = findGSolMintAuthority(client.config!);
  console.log("gsol mint auth", gsolMintAuthority);

  const signature = await client.createMetadata(
    uri,
    tokenName,
    symbol,
    gsolMintAuthority
  );

  console.log(signature);

  const balance = await connection.getBalance(wallet.publicKey);
  console.log("Current balance is", balance / LAMPORTS_PER_SOL);
})().catch(console.error);
