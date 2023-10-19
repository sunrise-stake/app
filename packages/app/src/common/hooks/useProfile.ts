import { type PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  type Profile as CivicProfile,
  CivicProfile as CivicSDK,
} from "@civic/profile";
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
  const { connection } = useConnection();
  const { publicKey: connectedWallet } = useWallet();
  const [profile, setProfile] = useState<Profile>({
    address: address?.toBase58() ?? "",
    name: truncatedAddress(address) ?? "",
    image: DEFAULT_IMAGE_URL,
  });
  const [civicProfile, setCivicProfile] = useState<CivicProfile>();

  const profileAddress = address ?? connectedWallet;

  useEffect(() => {
    if (!profileAddress) return;
    CivicSDK.get(profileAddress.toBase58(), {
      solana: {
        connection,
      },
    })
      .then(setCivicProfile)
      .catch(console.error);
  }, [profileAddress]);

  useEffect(() => {
    setProfile({
      address: profileAddress?.toBase58() ?? "",
      name: civicProfile?.name?.value ?? truncatedAddress(profileAddress) ?? "",
      image: civicProfile?.image?.url ?? DEFAULT_IMAGE_URL,
    });
  }, [civicProfile]);

  return profile;
};
