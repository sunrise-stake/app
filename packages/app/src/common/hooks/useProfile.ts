import { type PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toShortBase58 } from "../utils";

export interface Profile {
  address: string;
  name: string;
  image: string;
}

const DEFAULT_IMAGE_URL = "default_pfp.png";

const truncatedAddress = (
  address: PublicKey | undefined | null
): string | undefined => {
  if (!address) return undefined;
  return toShortBase58(address);
};

export const useProfile = (address?: PublicKey): Profile => {
  const { publicKey: connectedWallet } = useWallet();
  const profileAddress = address ?? connectedWallet;

  return {
    address: profileAddress?.toBase58() ?? "",
    name: truncatedAddress(profileAddress) ?? "",
    image: DEFAULT_IMAGE_URL,
  };
};
