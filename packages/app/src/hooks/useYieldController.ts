import { useEffect, useState } from "react";
import {
  type YieldControllerState,
  YieldControllerClient,
} from "@sunrisestake/yield-controller";
import { AnchorProvider } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Environment } from "@sunrisestake/client";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Keypair } from "@solana/web3.js";

const stage =
  (process.env.REACT_APP_SOLANA_NETWORK as keyof typeof Environment) ??
  WalletAdapterNetwork.Devnet;

export const useYieldController = (): YieldControllerState | undefined => {
  const { connection } = useConnection();
  const [yieldState, setYieldState] = useState<YieldControllerState>();
  useEffect(() => {
    void (async () => {
      const provider = new AnchorProvider(
        connection,
        // we only need a read-only wallet - this allows us to get the yield status
        // before the user has connected
        {
          publicKey: Keypair.generate().publicKey,
          signAllTransactions: async (txes) => txes,
          signTransaction: async (tx) => tx,
        },
        {}
      );
      const env = Environment[stage];
      const yieldControllerClient = await YieldControllerClient.get(
        provider,
        env.yieldControllerState
      ).catch((e) => {
        console.error(e);
        throw e;
      });
      yieldControllerClient
        .getState()
        .then(setYieldState)
        .catch((e) => {
          console.error(e);
        });
    })();
  }, [connection]);

  return yieldState;
};
