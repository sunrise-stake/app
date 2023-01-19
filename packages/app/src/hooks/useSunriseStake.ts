import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { StakeAccount } from "../lib/stakeAccount";
import { walletIsConnected } from "../lib/util";
import { Keypair } from "@solana/web3.js";

export const useSunriseStake = (): StakeAccount | undefined => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [sunriseStake, setSunriseStake] = useState<StakeAccount>();
  useEffect(() => {
    if (walletIsConnected(wallet)) {
      StakeAccount.init(connection, wallet)
        .then(setSunriseStake)
        .catch(console.error);
    }
  }, [wallet, connection]);

  return sunriseStake;
};

const dummyKey = Keypair.generate().publicKey;
export const useReadOnlySunriseStake = (): StakeAccount | undefined => {
  const { connection } = useConnection();
  const [sunriseStake, setSunriseStake] = useState<StakeAccount>();

  useEffect(() => {
    StakeAccount.init(connection, {
      connected: true,
      publicKey: dummyKey,
      signAllTransactions: async (txes) => txes,
      signTransaction: async (tx) => tx,
    })
      .then(setSunriseStake)
      .catch(console.error);
  }, [connection]);

  return sunriseStake;
};
