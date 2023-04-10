import { type Connection, type PublicKey } from "@solana/web3.js";
import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type Metadata,
  Metaplex,
  type Nft,
  type NftWithToken,
  type Sft,
  type SftWithToken,
} from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { replaceInArray } from "../utils";

export type UnloadedNFT = Metadata | Nft | Sft;
export type GenericNFT = Sft | SftWithToken | Nft | NftWithToken;

export interface NFTQuery {
  mintAddress?: PublicKey;
  updateAuthority?: PublicKey;
  collection?: PublicKey;
}

/**
 * Create a filter function for a given query.
 * @param query
 */
const nftFilter = (query: NFTQuery) => (nft: UnloadedNFT) => {
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
 * Get all NFTs for a given owner (without metadata)
 * @param owner
 * @param connection
 */
const getAllNFTs = async (
  owner: PublicKey,
  connection: Connection
): Promise<UnloadedNFT[]> => {
  const nftClient = Metaplex.make(connection).nfts();
  return nftClient.findAllByOwner({
    owner,
  });
};

const isEmptyQuery = (query: NFTQuery): boolean =>
  !query.mintAddress && !query.updateAuthority && !query.collection;

interface NFTsContextValue {
  nfts: UnloadedNFT[];
  loadNFTMetadata: (nft: UnloadedNFT) => Promise<GenericNFT>;
}
const NFTsContext = createContext<NFTsContextValue>({
  nfts: [],
  loadNFTMetadata: async (nft: UnloadedNFT) =>
    Promise.resolve(nft as GenericNFT),
});

/**
 * A context provider for NFTs. This provides a cache for all NFTs owned by the
 * current wallet. The context should not be used directly, but rather the
 * useNFTs hook, which allows NFTs to be queried, and only the metadata for those that match the
 * query will be loaded.
 * @param children
 * @constructor
 */
export const NFTsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey: owner } = useWallet();
  const [nfts, setNfts] = useState<UnloadedNFT[]>([]);

  /**
   * When the connected wallet changes, load all NFTs for that owner.
   */
  useEffect(() => {
    void (async () => {
      if (owner === null) return;
      return getAllNFTs(owner, connection).then(setNfts);
    })();
  }, [owner?.toBase58()]);

  /**
   * Given an NFT, load its metadata and update the cache.
   * @param nft
   */
  const loadNFTMetadata = async (nft: UnloadedNFT): Promise<GenericNFT> => {
    if (nft.jsonLoaded) return nft as GenericNFT;

    const nftClient = Metaplex.make(connection).nfts();
    const loadedNFT = await nftClient.load({
      metadata: nft as Metadata,
      loadJsonMetadata: true,
    });
    setNfts((nfts) => replaceInArray(nfts, nft, loadedNFT));
    return loadedNFT;
  };

  return (
    <NFTsContext.Provider value={{ nfts, loadNFTMetadata }}>
      {children}
    </NFTsContext.Provider>
  );
};

/**
 * A hook for querying the cached NFTs. This will only load the metadata for
 * NFTs that match the query.
 * @param query
 */
export const useNFTs = (query: NFTQuery): GenericNFT[] => {
  const { nfts, loadNFTMetadata } = useContext(NFTsContext);
  const [filteredNfts, setFilteredNfts] = useState<GenericNFT[]>([]);

  const loadFilteredNFTs = async (): Promise<GenericNFT[]> => {
    const filteredNfts = nfts.filter(nftFilter(query));
    console.log("filtered nfts", filteredNfts);
    return Promise.all(filteredNfts.map(loadNFTMetadata));
  };

  useEffect(() => {
    void (async () => {
      console.log("query", query);
      if (isEmptyQuery(query)) return;
      console.log("querying");
      await loadFilteredNFTs().then(setFilteredNfts);
    })();
  }, [nfts.length]);

  return filteredNfts;
};
