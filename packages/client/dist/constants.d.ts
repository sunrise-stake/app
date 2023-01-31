import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";
export declare const STAKE_POOL_PROGRAM_ID: PublicKey;
interface EnvironmentConfig {
  state: PublicKey;
  holdingAccount: PublicKey;
}
export declare const Environment: Record<
  WalletAdapterNetwork,
  EnvironmentConfig
>;
interface BlazeConfig {
  pool: PublicKey;
  bsolMint: PublicKey;
}
export declare const SolBlazeEnvironment: Record<
  WalletAdapterNetwork,
  BlazeConfig
>;
export declare const SOLBLAZE_CONFIG: BlazeConfig;
export declare const SUNRISE_STAKE_STATE: PublicKey;
export declare const HOLDING_ACCOUNT: PublicKey;
export declare const DEFAULT_LP_PROPORTION = 10;
export declare const DEFAULT_LP_MIN_PROPORTION = 5;
export declare const MARINADE_TICKET_RENT = 1503360;
export declare const NETWORK_FEE = 5000;
export declare const MINIMUM_EXTRACTABLE_YIELD = 100000000;
export {};
