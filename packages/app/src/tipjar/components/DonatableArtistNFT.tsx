import { type FC } from "react";
import { PublicKey } from "@solana/web3.js";

import {
  type GenericNFT,
  type NFTQuery,
} from "../../common/context/NFTsContext";
import { useNFTsFilteredByOffchainMetadata } from "../../common/hooks/useNFTsFilteredByOffchainMetadata";
import { type Artist, type Charity } from "../../grow/types";

import artists from "../data/artists.json";
import { DripDonateButton } from "./DripDonateButton";

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

  if (artist === undefined) return null;

  return {
    website: artist.website,
    name: nft.json.name,
    imageUrl: nft.json.image,
    address: artist.wallet,
  };
};

interface Props {
  query: NFTQuery & { jsonFilter?: any };
  onDonate?: (charity: Artist) => void;
}

/**
 * Display NFTs that match the query and allow you to donate to the artist
 * @param query
 * @constructor
 */
export const DonatableArtistNFT: FC<Props> = ({ query, onDonate }) => {
  const nfts = useNFTsFilteredByOffchainMetadata({
    ...query,
    jsonFilter: query.jsonFilter ?? {},
  });

  return (
    <>
      {nfts.filter((nft) => toCharity(nft) !== null).length === 0 ? (
        <div className="container mb-12 text-center">
          <img className="inline" src="earth_day/tipjar.png" />
          <h1 className="my-4 text-3xl">
            Recognition for those who deserve it.
          </h1>
          <p>
            Received an Earth Day NFT? Drop some SOL in your artist&apos;s wallet.
            DRiP is all about free art, so there&apos;s no obligation.
            Every lamport is appreciated!
          </p>
        </div>
      ) : null}
      <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
        {nfts.map((nft) => {
          const charity = toCharity(nft);
          const artist = getArtist(nft);
          if (!charity) return null;
          return (
            <div
              key={nft.address.toBase58()}
              className="z-10 mb-8 relative h-fit w-full border-[1px] rounded-lg border-[#969696]"
            >
              <div className="w-full max-h-[338px] rounded-t-lg bg-black text-center">
                <img
                  src={charity.imageUrl}
                  alt={charity.name}
                  className="inline-block max-h-[338px] object-center rounded-t-lg"
                />
              </div>
              <div className="w-full p-4 bg-white rounded-b-lg">
                <h3 className="text-2xl text-black font-bold">
                  {charity.name}
                </h3>
                <h4 className="py-2 text-base text-black">{artist?.twitter}</h4>
                {artist !== undefined ? (
                  <DripDonateButton artist={artist} onDonate={onDonate} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
