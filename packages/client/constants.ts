import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";

export const STAKE_POOL_PROGRAM_ID = new PublicKey(
  "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"
);

interface EnvironmentConfig {
  state: PublicKey;
  holdingAccount: PublicKey;
}
export const Environment: Record<WalletAdapterNetwork, EnvironmentConfig> = {
  "mainnet-beta": {
    state: new PublicKey("43m66crxGfXSJpmx5wXRoFuHubhHA1GCvtHgmHW6cM1P"),
    holdingAccount: new PublicKey(
      "shcFT8Ur2mzpX61uWQRL9KyERZp4w2ehDEvA7iaAthn"
    ),
  },
  testnet: {
    state: new PublicKey("DR3hrjH6SZefraRu8vaQfEhG5e6E25ZwccakQxWRePkC"), // Warning obsolete
    holdingAccount: new PublicKey(
      "dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD"
    ), // TODO incorrect
  },
  devnet: {
    state: new PublicKey("Jpp29FzyV7rXdVRWFaiE9tBcVCaEMvj16gk87rC3S4z"),
    holdingAccount: new PublicKey(
      "dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD"
    ),
  },
};

interface BlazeConfig {
  pool: PublicKey;
  bsolMint: PublicKey;
}

export const SolBlazeEnvironment: Record<WalletAdapterNetwork, BlazeConfig> = {
  "mainnet-beta": {
    pool: new PublicKey("stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"),
    bsolMint: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
  },
  devnet: {
    pool: new PublicKey("azFVdHtAJN8BX3sbGAYkXvtdjdrT5U6rj9rovvUFos9"),
    bsolMint: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
  },
  testnet: {
    pool: PublicKey.default,
    bsolMint: PublicKey.default,
  },
};

export const SOLBLAZE_CONFIG =
  SolBlazeEnvironment[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ];

export const SUNRISE_STAKE_STATE =
  Environment[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ].state;

export const HOLDING_ACCOUNT =
  Environment[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ].holdingAccount;

export const DEFAULT_LP_PROPORTION = 10;
export const DEFAULT_LP_MIN_PROPORTION = 5;

export const MARINADE_TICKET_RENT = 1503360;

export const NETWORK_FEE = 5000;

export const MINIMUM_EXTRACTABLE_YIELD = 100_000_000; // 0.1 SOL