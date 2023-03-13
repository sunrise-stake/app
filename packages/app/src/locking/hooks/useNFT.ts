import { type Connection, type PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import {
  Metaplex,
  type Nft,
  type NftWithToken,
  type Sft,
  type SftWithToken,
} from "@metaplex-foundation/js";
import { useConnection } from "@solana/wallet-adapter-react";

type GenericNFT = Sft | SftWithToken | Nft | NftWithToken;
const getMetadata = async (
  mintAddress: PublicKey,
  connection: Connection
): Promise<GenericNFT> => {
  const metaplex = Metaplex.make(connection);
  const nft = await metaplex
    .nfts()
    .findByMint({ mintAddress, loadJsonMetadata: true });
  console.log("NFT", nft);
  return nft;
};

export const useNFT = (mintAddress?: PublicKey): GenericNFT | undefined => {
  const { connection } = useConnection();
  const [metadata, setMetadata] = useState<GenericNFT>();
  useEffect(() => {
    void (async () => {
      if (!mintAddress) return;
      return getMetadata(mintAddress, connection).then(setMetadata);
    })();
  }, [mintAddress]);

  return metadata;
};
