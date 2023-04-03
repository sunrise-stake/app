import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Environment } from "@sunrisestake/client";
import {
  type BuyAndBurnState,
  YieldControllerClient,
} from "@sunrisestake/yield-controller";

import { readonlyWallet } from "../helper";

const stage =
  (process.env.REACT_APP_SOLANA_NETWORK as keyof typeof Environment) ??
  WalletAdapterNetwork.Devnet;

async function getYieldState(): Promise<BuyAndBurnState> {
  const env = Environment[stage];
  const client = await YieldControllerClient.get(
    readonlyWallet,
    env.yieldControllerState
  );
  return client.getState();
}

export { getYieldState };
