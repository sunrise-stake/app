import { type FC } from "react";
import { useNFTsFilteredByOffchainMetadata } from "../hooks/useNFTsFilteredByOffchainMetadata";
import {
  type GenericNFT,
  type NFTQuery,
} from "../../common/context/NFTsContext";
import { CharityDonateButton } from "./CharityDonateButton";
import { type Charity } from "./types";

import artists from "./artists.json";
import { PublicKey } from "@solana/web3.js";

interface Artist {
  twitter: string;
  wallet: PublicKey;
  website: string;
}

const getArtist = (nft: GenericNFT): Artist | undefined => {
  const twitterHandle = nft.json?.attributes?.find(
    (attr) => attr.trait_type === "artis"
  )?.value;

  const foundRawArtist = artists.find(
    (artist) => artist.twitter === twitterHandle
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
    throw new Error("NFT has no metadata");

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
    <div>
      {nfts.map((nft) => {
        const charity = toCharity(nft);
        if (!charity) return null;
        return (
          <div key={nft.mint.address.toBase58()}>
            <CharityDonateButton
              charity={charity}
              key={nft.address.toBase58()}
            />
          </div>
        );
      })}
    </div>
  );
};
