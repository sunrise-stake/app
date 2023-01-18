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
    state: new PublicKey("Jpp29FzyV7rXdVRWFaiE9tBcVCaEMvj16gk87rC3S4z"),
  },
};

export const DEFAULT_LP_PROPORTION = 10;
export const DEFAULT_LP_MIN_PROPORTION = 5;

export const MARINADE_TICKET_RENT = 1503360;

export const NETWORK_FEE = 5000;

export const MINIMUM_EXTRACTABLE_YIELD = 100_000_000; // 0.1 SOL
