import { type WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";
import { type EpochReportAccount } from "./types/EpochReportAccount.js";
import BN from "bn.js";

export const MAX_NUM_PRECISION = 5;

// on devnet, the solblaze pool is sometimes unavailable for deposits - use this to disable it
export const SOLBLAZE_ENABLED = true;

export const STAKE_POOL_PROGRAM_ID = new PublicKey(
  "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"
);

export const IMPACT_NFT_PROGRAM_ID = new PublicKey(
  "SUNFT6ErsQvMcDzMcGyndq2P31wYCFs6G6WEcoyGkGc"
);

interface BlazeConfig {
  pool: PublicKey;
  bsolMint: PublicKey;
}

export interface EnvironmentConfig {
  state: PublicKey;
  holdingAccount: PublicKey;
  yieldControllerState: PublicKey;
  percentageStakeToMarinade: number;
  blaze: BlazeConfig;
  impactNFT: {
    state: PublicKey | undefined; // if undefined, impact nft is disabled
  };
}
export const Environment: Record<
  WalletAdapterNetwork | "localnet",
  EnvironmentConfig
> = {
  "mainnet-beta": {
    state: new PublicKey("43m66crxGfXSJpmx5wXRoFuHubhHA1GCvtHgmHW6cM1P"),
    holdingAccount: new PublicKey(
      "shcFT8Ur2mzpX61uWQRL9KyERZp4w2ehDEvA7iaAthn"
    ),
    yieldControllerState: new PublicKey(
      "DzyP73X4TWnh5jarfjapaNBxtjeEVsfknWVfToRYARDL" // Buy & Burn Yield Controller
    ),
    percentageStakeToMarinade: 75,
    blaze: {
      pool: new PublicKey("stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"),
      bsolMint: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
    },
    impactNFT: {
      state: new PublicKey("6RzCneyeEqnjiWxrzqfBwHDEpTrbcSkBFFUrtMZnNjpc"),
    },
  },
  // TODO placeholders
  testnet: {
    state: new PublicKey("DR3hrjH6SZefraRu8vaQfEhG5e6E25ZwccakQxWRePkC"), // Warning obsolete
    holdingAccount: PublicKey.default,
    percentageStakeToMarinade: 75,
    yieldControllerState: new PublicKey(
      "8Z8BwUqZTD8XyJ6sdEEeWLaZ9Bg1J7TRDoYPfhkGS9Hr"
    ),
    blaze: {
      pool: PublicKey.default,
      bsolMint: PublicKey.default,
    },
    impactNFT: {
      state: PublicKey.default, // TODO
    },
  },
  devnet: {
    state: new PublicKey("Jpp29FzyV7rXdVRWFaiE9tBcVCaEMvj16gk87rC3S4z"),
    holdingAccount: new PublicKey(
      "dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD"
    ),
    yieldControllerState: new PublicKey(
      "8Z8BwUqZTD8XyJ6sdEEeWLaZ9Bg1J7TRDoYPfhkGS9Hr" // Buy & Burn Yield Controller
    ),
    percentageStakeToMarinade: 75,
    blaze: {
      pool: new PublicKey("azFVdHtAJN8BX3sbGAYkXvtdjdrT5U6rj9rovvUFos9"),
      bsolMint: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
    },
    impactNFT: {
      state: new PublicKey("6iyfwPbbLeYAoUcQkECCPwftFuw3j5VEcXF7xcQeAdX6"),
    },
  },
  localnet: {
    state: new PublicKey("28SkW4iD7UJc9zkxcq6yNb1MFX2hxqdJjxjZs67Jwr2b"),
    holdingAccount: new PublicKey(
      "dhcB568T3skiP2D9ujf4eAJEnW2gACaaA9BUCVbwbXD"
    ),
    yieldControllerState: new PublicKey(
      "77aJfgRudbv9gFfjRQw3tuYzgnjoDgs9jorVTmK7cv73"
    ),
    percentageStakeToMarinade: 75,
    blaze: {
      pool: new PublicKey("azFVdHtAJN8BX3sbGAYkXvtdjdrT5U6rj9rovvUFos9"),
      bsolMint: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
    },
    impactNFT: {
      state: PublicKey.default, // TODO
    },
  },
};

export const DEFAULT_LP_PROPORTION = 10;
export const DEFAULT_LP_MIN_PROPORTION = 5;

export const MARINADE_TICKET_RENT = 1503360;

export const NETWORK_FEE = 5000;

export const MINIMUM_EXTRACTABLE_YIELD = 100_000_000; // 0.1 SOL

export const EMPTY_EPOCH_REPORT: EpochReportAccount = {
  epoch: new BN(0),
  tickets: new BN(0),
  totalOrderedLamports: new BN(0),
  extractableYield: new BN(0),
  extractedYield: new BN(0),
  currentGsolSupply: new BN(0),
};
