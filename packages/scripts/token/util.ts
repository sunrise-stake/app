import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  BundlrStorageDriver,
} from "@metaplex-foundation/js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import * as fs from "fs";
import os from "os";
import { AnchorProvider } from "@coral-xyz/anchor";

const name = "Sunrise gSOL";
const description = "Sunrise Stake Green SOL Token";
const symbol = "GSOL";
const imageFile = "gSOL.png";

const keypair = Keypair.fromSecretKey(
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Buffer.from(require(os.homedir() + "/.config/solana/id.json"))
);

export const provider = AnchorProvider.env();

export const metaplex = Metaplex.make(provider.connection)
  .use(keypairIdentity(keypair))
  .use(
    bundlrStorage({
      address: "https://node1.bundlr.network", // There is also https://node2.bundlr.network, what is the difference?
      providerUrl: "https://api.mainnet-beta.solana.com", // Maybe use custom RPC endpoint from .env file?
      timeout: 60000,
    })
  );

export const getMetadataAddress = (mint: PublicKey): PublicKey =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];

// Transfrom file to metaplex file
const buffer = fs.readFileSync("packages/app/public/" + imageFile);
export const file = toMetaplexFile(buffer, imageFile);

// Fund bundlr node
const fundBundlrNode = async (): Promise<void> => {
  const bundlrStorageDriver = metaplex
    .storage()
    .driver() as BundlrStorageDriver;

  const price = await bundlrStorageDriver.getUploadPriceForFiles([file]);
  console.log("Cost of storage for metadata: ", price);

  await bundlrStorageDriver.fund(price);
};

export const uploadMetadata = async (): Promise<string> => {
  await fundBundlrNode();

  const image = await metaplex.storage().upload(file);
  console.log("image uri: ", image);

  // Upload metadata and get metadata uri
  const response = await metaplex.nfts().uploadMetadata({
    ...metadata,
    image,
  });
  console.log("metadata upload response:", response);
  return response.uri;
};

export const metadata = {
  name,
  description,
  symbol,
};
