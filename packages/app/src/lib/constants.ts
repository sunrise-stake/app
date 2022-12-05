import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";

interface EnvironmentConfig {
  state: PublicKey;
}
export const Environment: Record<WalletAdapterNetwork, EnvironmentConfig> = {
  "mainnet-beta": {
    state: new PublicKey("BYR3oVpbzoTFV834SVDyXtsFwa3hF5rFcVwHkfKnfhpN"),
  },
  testnet: {
    state: new PublicKey("DR3hrjH6SZefraRu8vaQfEhG5e6E25ZwccakQxWRePkC"),
  },
  devnet: {
    state: new PublicKey("5n9pFrHb1RLuDuX4eb6Jh89kLpzcFs4R5BFuTJkFcd4q"),
  },
};
