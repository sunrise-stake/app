import { useEffect, useState } from "react";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { StakeAccount } from "../lib/stakeAccount";
import { ConnectedWallet, walletIsConnected } from "../lib/util";
import { Connection, Keypair } from "@solana/web3.js";

const FAKE_WALLET: ConnectedWallet = {
  connected: true,
  publicKey: Keypair.generate().publicKey,
  signAllTransactions: async (txes: any) => txes,
  signTransaction: async (tx: any) => tx,
};

interface SunriseStakeContext {
  connection: Connection;
  wallet: WalletContextState;
  stakeAccount: StakeAccount | undefined;
}

export const useSunriseStake = (
  opts = { readOnly: false }
): SunriseStakeContext => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [stakeAccount, setStakeAccount] = useState<StakeAccount>();
  useEffect(() => {
    if (walletIsConnected(wallet)) {
      StakeAccount.init(connection, opts?.readOnly ? FAKE_WALLET : wallet)
        .then(setStakeAccount)
        .catch(console.error);
    }
  }, [wallet, connection]);

  return { connection, stakeAccount, wallet };
};
