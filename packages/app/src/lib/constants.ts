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

interface SolBlazeConfig {
  pool: PublicKey;
  bsolMint: PublicKey;
  validatorList: PublicKey;
  reserveAccount: PublicKey;
  updaterAccount: PublicKey;
  managerAccount: PublicKey;
  stakeAuthority: PublicKey;
  feesDepot: PublicKey;
  validatorInfo: PublicKey;
}

export const SolBlazeConstants: Record<WalletAdapterNetwork, SolBlazeConfig> = {
  "mainnet-beta": {
    pool: new PublicKey("stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"),
    bsolMint: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
    validatorList: new PublicKey("1istpXjy8BM7Vd5vPfA485frrV7SRJhgq5vs3sskWmc"),
    reserveAccount: new PublicKey(
      "rsrxDvYUXjH1RQj2Ke36LNZEVqGztATxFkqNukERqFT"
    ),
    updaterAccount: new PublicKey(
      "upd7dui9VYY9JbYLgpFy4rh9WAMjcm8YxiUBnENy69j"
    ),
    managerAccount: new PublicKey(
      "b1azeTfpBiKN6AhEGVd1iPBsX3vmZqnFmS7Kqau7a2w"
    ),
    stakeAuthority: new PublicKey(
      "6WecYymEARvjG5ZyqkrVQ6YkhPfujNzWpSPwNKXHCbV2"
    ),
    feesDepot: new PublicKey("Dpo148tVGewDPyh2FkGV18gouWctbdX2fHJopJGe9xv1"),
    validatorInfo: new PublicKey(
      "Hn5e7ky1y7pGMbe8X5G51YcDyzo7GomZ1wUcS6HZEJkT"
    ),
  },

  devnet: {
    pool: new PublicKey("azFVdHtAJN8BX3sbGAYkXvtdjdrT5U6rj9rovvUFos9"),
    bsolMint: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
    validatorList: new PublicKey("aEP3DRe8ssFXDFokXiNMo4UXLhpL7LEPVbneUsfqeaJ"),
    reserveAccount: new PublicKey(
      "aRkys1kVHeysrcn9bJFat9FkvoyyYD8M1kK286X3Aro"
    ),
    updaterAccount: new PublicKey(
      "upd7dui9VYY9JbYLgpFy4rh9WAMjcm8YxiUBnENy69j"
    ),
    managerAccount: new PublicKey(
      "b1azeTfpBiKN6AhEGVd1iPBsX3vmZqnFmS7Kqau7a2w"
    ),
    stakeAuthority: PublicKey.default,
    feesDepot: new PublicKey("Dpo148tVGewDPyh2FkGV18gouWctbdX2fHJopJGe9xv1"),
    validatorInfo: PublicKey.default,
  },

  testnet: {
    pool: PublicKey.default,
    bsolMint: PublicKey.default,
    validatorList: PublicKey.default,
    reserveAccount: PublicKey.default,
    updaterAccount: PublicKey.default,
    managerAccount: PublicKey.default,
    stakeAuthority: PublicKey.default,
    feesDepot: PublicKey.default,
    validatorInfo: PublicKey.default,
  },
};

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

export const SOLBLAZE_CONFIG =
  SolBlazeConstants[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ];

export const [SOLBLAZE_WITHDRAW_AUTHORITY] = PublicKey.findProgramAddressSync(
  [SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("withdraw")],
  STAKE_POOL_PROGRAM_ID
);

export const [SOLBLAZE_DEPOSIT_AUTHORITY] = PublicKey.findProgramAddressSync(
  [SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("deposit")],
  STAKE_POOL_PROGRAM_ID
);

export const DEFAULT_LP_PROPORTION = 10;
export const DEFAULT_LP_MIN_PROPORTION = 5;

export const MARINADE_TICKET_RENT = 1503360;

export const NETWORK_FEE = 5000;

export const MINIMUM_EXTRACTABLE_YIELD = 100_000_000; // 0.1 SOL
