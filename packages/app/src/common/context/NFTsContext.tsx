import { type Connection, PublicKey } from "@solana/web3.js";
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

const hasMintAddress = (nft: UnloadedNFT): nft is Metadata =>
  "mintAddress" in nft;

const matchesMintAddress = (
  nft: UnloadedNFT,
  mintAddress: PublicKey
): boolean =>
  nft.address.equals(mintAddress) ||
  (hasMintAddress(nft) && nft.mintAddress.equals(mintAddress));

/**
 * Create a filter function for a given query.
 * @param query
 */
const nftFilter = (query: NFTQuery) => (nft: UnloadedNFT) => {
  if (query.mintAddress) {
    return matchesMintAddress(nft, query.mintAddress);
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

// Based on the Helius API response (not 100% comprehensive)
interface RawCompressedNFT {
  id: string; // The Asset ID
  content: {
    files: Array<{ uri: string; mime: string }>;
    json_uri: string;
    metadata: {
      attributes: Array<{ value: string; trait_type: string }>;
      description: string;
      name: string;
      symbol: string;
    };
  };
  grouping: Array<{ group_key: string; group_value: string }>;
  creators: Array<{ address: string; share: number; verified: boolean }>;
  ownership: Array<{
    owner: string;
    frozen: boolean;
    delegated: boolean;
    ownership_model: string;
  }>;
  authorities: Array<{ address: string; scopes: string[] }>;
}

/**
 * Given a compressed NFT from the Helius endpoint,
 * turn it into a GenericNFT object (with some gaps that we don't need)
 * @param nft
 */
const compressedNFTToGenericNFT = async (
  nft: RawCompressedNFT
): Promise<GenericNFT> => {
  const collection = nft.grouping.find(
    (grouping) => grouping.group_key === "collection"
  )?.group_value;

  const updateAuthority = nft.authorities.find(
    (authority) =>
      authority.scopes.includes("update") || authority.scopes.includes("full")
  )?.address;

  const offchainMetadata = await fetch(nft.content.json_uri).then(async (res) =>
    res.json()
  );

  const image =
    offchainMetadata.image ??
    nft.content.files.find((file) => file.mime.startsWith("image/"))?.uri;

  const attributes = [
    ...(nft.content.metadata.attributes ?? []),
    ...offchainMetadata.attributes,
  ];

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    address: new PublicKey(nft.id), // Warning, this is not the token address
    json: {
      attributes,
      description: nft.content.metadata.description,
      image,
      name: nft.content.metadata.name,
    },
    ...(collection !== undefined
      ? {
          collection: {
            address: new PublicKey(collection),
          },
        }
      : {}),
    jsonLoaded: true,
    ...(updateAuthority !== undefined
      ? { updateAuthorityAddress: new PublicKey(updateAuthority) }
      : {}),
  } as GenericNFT;
};

/**
 * Retrieve NFTs from a proxied RPC endpoint
 * following the nascent Digital Asset Standard RPC schema
 * https://metaplex.notion.site/Digital-Asset-Standard-Public-2d764bcd8f8940b69150ce11200858cd
 * @param owner
 */
const getAllCompressedNFTs = async (owner: PublicKey): Promise<GenericNFT[]> =>
  fetch("https://rpc-proxy.danielbkelleher3799.workers.dev/", {
    method: "POST",
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetsByOwner",
      params: [
        owner.toBase58(),
        {
          sortBy: "created",
          sortDirection: "desc",
        },
        250,
        1,
        "",
        "",
      ],
    }),
  })
    .then(async (res) => res.json())
    // remove non-compressedNFTs (loaded elsewhere)
    .then(async (res) =>
      Promise.all(
        res.result.items
          .filter((item: any) => item.compression?.compressed)
          .map(compressedNFTToGenericNFT)
      )
    );

const isEmptyQuery = (query: NFTQuery): boolean =>
  !query.mintAddress && !query.updateAuthority && !query.collection;

interface NFTsContextValue {
  nfts: UnloadedNFT[];
  refresh: () => Promise<void>;
  loadNFTMetadata: (nft: UnloadedNFT) => Promise<GenericNFT>;
}
const NFTsContext = createContext<NFTsContextValue>({
  nfts: [],
  refresh: async () => {},
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

  const loadAllNFTs = async (): Promise<void> => {
    if (owner === null) return;
    const nonCompressedNFTs = getAllNFTs(owner, connection);
    const compressedNFTs = getAllCompressedNFTs(owner);
    return Promise.all([nonCompressedNFTs, compressedNFTs])
      .then((arrays) => arrays.flat())
      .then(setNfts);
  };

  /**
   * When the connected wallet changes, load all NFTs for that owner.
   */
  useEffect(() => {
    loadAllNFTs().catch(console.error);
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
    <NFTsContext.Provider
      value={{ nfts, loadNFTMetadata, refresh: loadAllNFTs }}
    >
      {children}
    </NFTsContext.Provider>
  );
};

/**
 * A hook for querying the cached NFTs. This will only load the metadata for
 * NFTs that match the query.
 * @param query
 */
export const useNFTs = (
  query?: NFTQuery
): { nfts: GenericNFT[]; refresh: () => Promise<void> } => {
  const { nfts, loadNFTMetadata, refresh } = useContext(NFTsContext);
  const [filteredNfts, setFilteredNfts] = useState<GenericNFT[]>([]);

  const loadFilteredNFTs = async (): Promise<GenericNFT[]> => {
    const filteredNfts =
      query && !isEmptyQuery(query) ? nfts.filter(nftFilter(query)) : nfts;
    return Promise.all(filteredNfts.map(loadNFTMetadata));
  };

  useEffect(() => {
    void (async () => {
      await loadFilteredNFTs().then(setFilteredNfts);
    })();
  }, [nfts.length]);

  return {
    nfts: filteredNfts,
    refresh,
  };
};
