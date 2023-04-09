import {
  type GenericNFT,
  type NFTQuery,
  useNFTs,
} from "../../common/hooks/nft/useNFTs";

const isSubset = (superObj: any, subObj: any): boolean =>
  Object.keys(subObj).every((key) => {
    if (Array.isArray(subObj[key]) && Array.isArray(superObj[key])) {
      return subObj[key].every((subObjElement: any) =>
        (superObj[key] as any[]).find((superObjElement) =>
          isSubset(superObjElement, subObjElement)
        )
      );
    }
    if (typeof subObj[key] === "object" && typeof superObj[key] === "object") {
      return isSubset(superObj[key], subObj[key]);
    }
    return subObj[key] === superObj[key];
  });

export const useNFTsFilteredByOffchainMetadata = (
  query: NFTQuery & { jsonFilter: any }
): GenericNFT[] => {
  const matches = (nft: GenericNFT): boolean =>
    isSubset(nft.json, query.jsonFilter);

  const nfts = useNFTs(query);

  return nfts.filter(matches);
};
