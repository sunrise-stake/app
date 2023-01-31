import { ConfirmOptions, PublicKey, TokenAmount } from "@solana/web3.js";
import { ManagementAccount } from "./types/ManagementAccount";
import { MarinadeUtils } from "@sunrisestake/marinade-ts-sdk";
import { Details } from "./types/Details";
export declare const ZERO: any;
export declare const enum ProgramDerivedAddressSeed {
  G_SOL_MINT_AUTHORITY = "gsol_mint_authority",
  M_SOL_ACCOUNT = "msol_account",
  B_SOL_ACCOUNT = "bsol_account",
  ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT = "order_unstake_ticket_mgmt",
  ORDER_UNSTAKE_TICKET_ACCOUNT = "order_unstake_ticket_account",
}
export interface SunriseStakeConfig {
  stateAddress: PublicKey;
  gsolMint: PublicKey;
  treasury: PublicKey;
  updateAuthority: PublicKey;
  programId: PublicKey;
  liqPoolProportion: number;
  liqPoolMinProportion: number;
  options: Options;
}
export declare const findMSolTokenAccountAuthority: (
  config: SunriseStakeConfig
) => [PublicKey, number];
export declare const findBSolTokenAccountAuthority: (
  config: SunriseStakeConfig
) => [PublicKey, number];
export declare const findGSolMintAuthority: (
  config: SunriseStakeConfig
) => [PublicKey, number];
export declare const findOrderUnstakeTicketManagementAccount: (
  config: SunriseStakeConfig,
  epoch: bigint
) => [PublicKey, number];
export declare const findOrderUnstakeTicketAccount: (
  config: SunriseStakeConfig,
  epoch: bigint,
  index: bigint
) => [PublicKey, number];
export declare const logKeys: (transaction: any) => void;
export declare const confirm: (
  connection: any
) => (txSig: string) => Promise<any>;
export declare const setUpAnchor: () => any;
export interface Balance {
  gsolBalance: TokenAmount;
  gsolSupply: TokenAmount;
  msolBalance: TokenAmount;
  msolPrice: number;
  liqPoolBalance: TokenAmount;
  treasuryBalance: number;
  bsolBalance: TokenAmount;
}
export declare const PROGRAM_ID: any;
export declare const ZERO_BALANCE: {
  value: {
    amount: string;
    decimals: number;
    uiAmount: number;
    uiAmountString: string;
  };
};
export interface Options {
  confirmOptions?: ConfirmOptions;
  verbose?: boolean;
}
export declare const findAllTickets: (
  connection: any,
  config: SunriseStakeConfig,
  managementAccount: ManagementAccount,
  epoch: bigint
) => Promise<PublicKey[]>;
export declare const proportionalBN: (
  amount: any,
  numerator: any,
  denominator: any
) => any;
export declare const getStakeAccountInfo: (
  stakeAccount: any,
  anchorProvider: any
) => Promise<MarinadeUtils.ParsedStakeAccountInfo>;
export declare const getVoterAddress: (
  stakeAccount: any,
  provider: any
) => Promise<PublicKey>;
export declare const getValidatorIndex: (
  marinadeState: any,
  voterAddress: any
) => Promise<number>;
export declare const marinadeTargetReached: (
  details: Details,
  percentage: number
) => boolean;
