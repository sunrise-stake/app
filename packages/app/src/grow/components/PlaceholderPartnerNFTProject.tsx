import { type FC } from "react";
import { useNFTsFilteredByOffchainMetadata } from "../hooks/useNFTsFilteredByOffchainMetadata";
import { type NFTQuery } from "../../common/hooks/nft/useNFTs";

interface Props {
  query: NFTQuery & { jsonFilter?: any };
}
export const PlaceholderPartnerNFTProject: FC<Props> = ({ query }) => {
  const nfts = useNFTsFilteredByOffchainMetadata({
    ...query,
    jsonFilter: query.jsonFilter ?? {},
  });

  return (
    <div>
      {nfts.map((nft) => (
        <div key={nft.mint.address.toBase58()}>
          <img src={nft.json?.image} alt="Partner NFT" className="m-auto" />
        </div>
      ))}
    </div>
  );
};
