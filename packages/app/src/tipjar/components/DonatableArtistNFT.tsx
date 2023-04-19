import { type FC } from "react";
import { PublicKey } from "@solana/web3.js";

import {
  type GenericNFT,
  type NFTQuery,
} from "../../common/context/NFTsContext";
import { useNFTsFilteredByOffchainMetadata } from "../../common/hooks/useNFTsFilteredByOffchainMetadata";
import { type Charity } from "../../grow/components/types";

import artists from "../data/artists.json";
import { DripDonateButton } from "./DripDonateButton";

interface Artist {
  twitter: string;
  wallet: PublicKey;
  website: string;
}

const getArtist = (nft: GenericNFT): Artist | undefined => {
  const twitterHandle = nft.json?.attributes?.find(
    (attr) => attr.trait_type?.toLowerCase() === "artist"
  )?.value;

  const foundRawArtist = artists.find(
    (artist) => artist.twitter.toLowerCase() === twitterHandle?.toLowerCase()
  );

  console.log("Looking for artist", twitterHandle, foundRawArtist);

  return foundRawArtist
    ? {
        ...foundRawArtist,
        wallet: new PublicKey(foundRawArtist.wallet),
      }
    : undefined;
};

const toCharity = (nft: GenericNFT): Charity | null => {
  if (nft.json?.name === undefined || nft.json?.image === undefined)
    return null;

  const artist = getArtist(nft);

  if (!artist) return null;

  return {
    website: artist.website,
    name: nft.json.name,
    imageUrl: nft.json.image,
    address: artist.wallet,
  };
};

interface Props {
  query: NFTQuery & { jsonFilter?: any };
}

/**
 * Display NFTs that match the query and allow you to donate to the artist
 * @param query
 * @constructor
 */
export const DonatableArtistNFT: FC<Props> = ({ query }) => {
  const nfts = useNFTsFilteredByOffchainMetadata({
    ...query,
    jsonFilter: query.jsonFilter ?? {},
  });

  return (
    <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
      {nfts.map((nft) => {
        const charity = toCharity(nft);
        const artist = getArtist(nft);
        if (!charity) return null;
        return (
          <div
            key={nft.address.toBase58()}
            className="mb-8 relative h-fit w-full border-[1px] rounded-lg border-[#969696]"
          >
            <div className="w-full p-[0.2%] h-[338px]">
              <img
                src={charity.imageUrl}
                alt={charity.name}
                className="h-full w-full object-center rounded-t-lg"
              />
            </div>
            <div className="w-full p-4">
              <h3 className="text-2xl text-[#000] font-bold">{charity.name}</h3>
              <h4 className="py-2 text-[1rem] text-[#000]">
                {artist?.twitter}
              </h4>
              <DripDonateButton charity={charity} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
