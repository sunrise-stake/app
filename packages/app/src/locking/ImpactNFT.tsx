import { type FC } from "react";
import { type Details } from "@sunrisestake/client";
import { useNFT } from "./hooks/useNFT";
import { Spinner } from "../common/components";

export const ImpactNFT: FC<{ details: Details["impactNFTDetails"] }> = ({
  details,
}) => {
  const nft = useNFT(details?.mint);

  return (
    <div>
      {nft?.json?.image !== undefined ? (
        <img src={nft.json.image} alt="Impact NFT" className="m-auto" />
      ) : (
        <Spinner />
      )}
    </div>
  );
};
