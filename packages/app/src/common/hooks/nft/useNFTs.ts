import { type Connection, type PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import {
  type Metadata,
  Metaplex,
  type Nft,
  type NftClient,
  type NftWithToken,
  type Sft,
  type SftWithToken,
} from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export type GenericNFT = Sft | SftWithToken | Nft | NftWithToken;

/**
 * For a set of nfts, load their off-chain metadata (warning - can be expensive time-wise)
 * @param client
 * @param nfts
 */
const loadMetadata = async (
  client: NftClient,
  nfts: Array<Metadata | Nft | Sft>
): Promise<GenericNFT[]> =>
  Promise.all(
    nfts.map(async (nft) =>
      client.load({ metadata: nft as Metadata, loadJsonMetadata: true })
    )
  );

/**
 * Create a filter function for a given query.
 * @param query
 */
const nftFilter = (query: NFTQuery) => (nft: Metadata | Nft | Sft) => {
  if (query.mintAddress) {
    return nft.address.equals(query.mintAddress);
  } else if (query.updateAuthority) {
    return nft.updateAuthorityAddress.equals(query.updateAuthority);
  } else if (query.collection) {
    return nft.collection?.address.equals(query.collection);
  } else {
    return false;
  }
};

/**
 * Given an NFT query, load all NFTs owned by an owner that match the query.
 * NOTE - for the "mintAddress" query, the owner is actually ignored. This is to simplify
 * the query object.
 *
 * If used frequently in an app, the result of `findAllByOwner` should be stored in a context or some app state,
 * to avoid unnecessary network calls.
 * @param query
 * @param owner
 * @param connection
 */
const getNFTs = async (
  query: NFTQuery,
  owner: PublicKey,
  connection: Connection
): Promise<GenericNFT[]> => {
  const nftClient = Metaplex.make(connection).nfts();

  // mint address is a simpler query - just find by mint - otherwise list all by owner then filter
  if (query.mintAddress) {
    return nftClient
      .findByMint({ mintAddress: query.mintAddress, loadJsonMetadata: true })
      .then((nft) => [nft]);
  } else {
    console.log("querying by owner", owner);
    const ownedNfts = await nftClient.findAllByOwner({
      owner,
    });

    const filteredNfts = ownedNfts.filter(nftFilter(query));
    console.log("filtered nfts", filteredNfts);
    return loadMetadata(nftClient, filteredNfts);
  }
};

const isEmptyQuery = (query: NFTQuery): boolean =>
  !query.mintAddress && !query.updateAuthority && !query.collection;

export interface NFTQuery {
  mintAddress?: PublicKey;
  updateAuthority?: PublicKey;
  collection?: PublicKey;
}

export const useNFTs = (query: NFTQuery): GenericNFT[] => {
  const { connection } = useConnection();
  const { publicKey: owner } = useWallet();
  const [nfts, setNfts] = useState<GenericNFT[]>([]);
  useEffect(() => {
    void (async () => {
      console.log("query", query);
      if (isEmptyQuery(query) || owner === null) return;
      console.log("querying");
      return getNFTs(query, owner, connection).then(setNfts);
    })();
  }, [
    query.mintAddress?.toBase58(),
    query.updateAuthority?.toBase58(),
    owner?.toBase58(),
  ]);

  return nfts;
};
