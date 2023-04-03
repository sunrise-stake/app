import { useWallet } from "@solana/wallet-adapter-react";
import { type FC, useEffect } from "react";
import { useSunriseStore } from "./useSunriseStore";

const SunriseStoreInitializer: FC = () => {
  const fetchYieldState = useSunriseStore((state) => state.fetchYieldState);
  useEffect(() => {
    fetchYieldState().catch(console.error);
  }, []);

  const wallet = useWallet();
  const updateStoreWallet = useSunriseStore((state) => state.updateWallet);
  useEffect(() => {
    updateStoreWallet(wallet);
  }, [wallet.publicKey]);

  return null;
};

export { SunriseStoreInitializer };
