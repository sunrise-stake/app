/// <reference types="bn.js" />
import {
  ConfirmOptions,
  Connection,
  PublicKey,
  TokenAmount,
  Transaction,
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, BN } from "@project-serum/anchor";
import { ManagementAccount } from "./types/ManagementAccount";
import { MarinadeState, MarinadeUtils } from "@sunrisestake/marinade-ts-sdk";
import { Details } from "./types/Details";
export declare const ZERO: anchor.BN;
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
export declare const logKeys: (transaction: Transaction) => void;
export declare const confirm: (
  connection: Connection
) => (
  txSig: string
) => Promise<anchor.web3.RpcResponseAndContext<anchor.web3.SignatureResult>>;
export declare const setUpAnchor: () => anchor.AnchorProvider;
export interface Balance {
  gsolBalance: TokenAmount;
  gsolSupply: TokenAmount;
  msolBalance: TokenAmount;
  msolPrice: number;
  liqPoolBalance: TokenAmount;
  treasuryBalance: number;
  bsolBalance: TokenAmount;
}
export declare const PROGRAM_ID: PublicKey;
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
  connection: Connection,
  config: SunriseStakeConfig,
  managementAccount: ManagementAccount,
  epoch: bigint
) => Promise<PublicKey[]>;
export declare const proportionalBN: (
  amount: BN,
  numerator: BN,
  denominator: BN
) => BN;
export declare const getStakeAccountInfo: (
  stakeAccount: PublicKey,
  anchorProvider: AnchorProvider
) => Promise<MarinadeUtils.ParsedStakeAccountInfo>;
export declare const getVoterAddress: (
  stakeAccount: PublicKey,
  provider: AnchorProvider
) => Promise<PublicKey>;
export declare const getValidatorIndex: (
  marinadeState: MarinadeState,
  voterAddress: PublicKey
) => Promise<number>;
export declare const marinadeTargetReached: (
  details: Details,
  percentage: number
) => boolean;
