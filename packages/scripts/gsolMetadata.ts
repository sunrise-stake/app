/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  bundlrStorage,
  keypairIdentity,
  Metaplex,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { web3 } from "@sunrisestake/marinade-ts-sdk";
import * as fs from "fs";

const TOKEN_NAME = "";
const DESCRIPTION = "";
const SYMBOL = "";
const IMAGE_FILE = "";
// const IMAGE_FILE_PATH = IMAGE_FILE;

async function createTokenMetadata(
  connection: Connection,
  metaplex: Metaplex,
  mint: PublicKey,
  user: Keypair, // mint authority
  symbol: string,
  name: string,
  description: string
) {
  const buffer = fs.readFileSync(IMAGE_FILE);
  const metaplexFile = toMetaplexFile(buffer, IMAGE_FILE);

  const imageUri = await metaplex.storage().upload(metaplexFile);
  const { uri } = await metaplex.nfts().uploadMetadata({
    name,
    description,
    image: imageUri,
  });

  const metadataPda = await metaplex.nfts().pdas().metadata({ mint });
  const tokenMetadata: DataV2 = {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  // tx to create onchain metadata
  const tx = await new Transaction().add(
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataPda,
        mint,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
      },
      {
        createMetadataAccountArgsV2: {
          data: tokenMetadata,
          isMutable: false,
        },
      }
    )
  );

  await sendAndConfirmTransaction(connection, tx, [user]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateTokenMetadata(
  connection: Connection,
  metaplex: Metaplex,
  mint: PublicKey,
  user: Keypair, // mint authority
  name: string,
  symbol: string,
  description: string
) {
  const buffer = fs.readFileSync(IMAGE_FILE);
  const file = toMetaplexFile(buffer, IMAGE_FILE);

  const imageUri = await metaplex.storage().upload(file);
  console.log("image uri", imageUri);

  const { uri } = await metaplex.nfts().uploadMetadata({
    name,
    description,
    image: imageUri,
  });
  console.log("metadata uri", uri);

  const metadataPDA = await metaplex.nfts().pdas().metadata({ mint });

  const tokenMetadata: DataV2 = {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const transaction = new web3.Transaction().add(
    createUpdateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        updateAuthority: user.publicKey,
      },
      {
        updateMetadataAccountArgsV2: {
          data: tokenMetadata,
          updateAuthority: user.publicKey,
          primarySaleHappened: true,
          isMutable: true,
        },
      }
    )
  );

  await sendAndConfirmTransaction(connection, transaction, [user]);
}

async function main() {
  const connection = await new Connection(clusterApiUrl("devnet"));
  const user = Keypair.generate(); // ! mint authority keypair

  const MINT_ADDRESS = "7NvJ4p1WUNZjEizGVtkxQbztNsiX6zRiCBpuFSr7cgMp";

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  await createTokenMetadata(
    connection,
    metaplex,
    new web3.PublicKey(MINT_ADDRESS),
    user,
    TOKEN_NAME, // Token name - REPLACE THIS WITH YOURS
    SYMBOL,
    DESCRIPTION
  );
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
