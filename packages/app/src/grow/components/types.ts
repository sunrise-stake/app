import { type PublicKey } from "@solana/web3.js";

export interface PlaceholderOrg {
  name: string;
  imageUrl: string;
}

export type Charity = PlaceholderOrg & {
  address: PublicKey;
  website: string;
};

export type Partner = PlaceholderOrg & {
  website: string;
  internal?: boolean;
};
