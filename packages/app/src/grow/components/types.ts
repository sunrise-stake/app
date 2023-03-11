import { type PublicKey } from "@solana/web3.js";

export interface PlaceholderCharity {
  name: string;
  imageUrl: string;
}

export type Charity = PlaceholderCharity & {
  address: PublicKey;
  websiteAddress: string;
};
