import { type FC } from "react";
import { type Details } from "@sunrisestake/client";
import { Spinner } from "../common/components";
import { useNFTs } from "../common/context/NFTsContext";

export const ImpactNFT: FC<{ details: Details["impactNFTDetails"] }> = ({
  details,
}) => {
  const { nfts } = useNFTs({ mintAddress: details?.mint });
  const nft = nfts?.[0];

  return (
    <a
      href={`https://solana.fm/address/${details?.mint.toBase58() ?? ""}`}
      target="_blank"
      rel="noreferrer"
    >
      <div className="max-w-md animate-fade-in transition-opacity mb-2">
        {nft?.json?.image !== undefined ? (
          <img src={nft.json.image} alt="Impact NFT" className="m-auto" />
        ) : (
          <Spinner />
        )}
      </div>
    </a>
  );
};
