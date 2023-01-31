import { SunriseStake } from "./types/SunriseStake";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SunriseStakeConfig, Options, Balance } from "./util";
import { Marinade, MarinadeState } from "@sunrisestake/marinade-ts-sdk";
import BN from "bn.js";
import { Details } from "./types/Details";
import { TicketAccount } from "./types/TicketAccount";
import { BlazeState } from "./types/Solblaze";
export * from "./types/SunriseStake";
export * from "./types/Details";
export * from "./types/TicketAccount";
export * from "./types/ManagementAccount";
export * from "./types/Solblaze";
export * from "./constants";
export declare class SunriseStakeClient {
  readonly provider: AnchorProvider;
  readonly stateAddress: PublicKey;
  readonly options: Options;
  readonly program: Program<SunriseStake>;
  config: SunriseStakeConfig | undefined;
  marinade: Marinade | undefined;
  marinadeState: MarinadeState | undefined;
  readonly staker: PublicKey;
  stakerGSolTokenAccount: PublicKey | undefined;
  msolTokenAccountAuthority: PublicKey | undefined;
  msolTokenAccount: PublicKey | undefined;
  bsolTokenAccountAuthority: PublicKey | undefined;
  bsolTokenAccount: PublicKey | undefined;
  blazeState: BlazeState | undefined;
  liqPoolTokenAccount: PublicKey | undefined;
  private constructor();
  private readonly log;
  private readonly init;
  private readonly sendAndConfirmTransaction;
  createGSolTokenAccountIx(): TransactionInstruction;
  makeDeposit(lamports: BN): Promise<string>;
  deposit(lamports: BN): Promise<string>;
  depositToBlaze(lamports: BN): Promise<string>;
  depositStakeToBlaze(stakeAccountAddress: PublicKey): Promise<string>;
  depositStakeAccount(stakeAccountAddress: PublicKey): Promise<string>;
  unstake(lamports: BN): Promise<string>;
  /**
   * Trigger a rebalance without doing anything else.
   */
  triggerRebalance(): Promise<string>;
  orderUnstake(lamports: BN): Promise<[string, PublicKey]>;
  private readonly toTicketAccount;
  getDelayedUnstakeTickets(): Promise<TicketAccount[]>;
  claimUnstakeTicket(ticketAccount: TicketAccount): Promise<string>;
  claimUnstakeTicketFromAddress(
    ticketAccountAddress: PublicKey
  ): Promise<string>;
  withdrawFromBlaze(amount: BN): Promise<string>;
  withdrawStakeFromBlaze(
    newStakeAccount: PublicKey,
    amount: BN
  ): Promise<string>;
  extractYieldIx(): Promise<TransactionInstruction>;
  extractYield(): Promise<string>;
  calculateWithdrawalFee(withdrawalLamports: BN, details: Details): BN;
  details(): Promise<Details>;
  private readonly computeLamportsFromMSol;
  private readonly computeLamportsFromBSol;
  private readonly getRegisterStateAccounts;
  private readonly calculateExtractableYield;
  static register(
    treasury: PublicKey,
    gsolMint: Keypair,
    options?: Options
  ): Promise<SunriseStakeClient>;
  update({
    newTreasury,
    newUpdateAuthority,
    newliqPoolProportion,
    newliqPoolMinProportion,
  }: {
    newTreasury?: PublicKey;
    newUpdateAuthority?: PublicKey;
    newliqPoolProportion?: number;
    newliqPoolMinProportion?: number;
  }): Promise<void>;
  balance(): Promise<Balance>;
  static get(
    provider: AnchorProvider,
    stateAddress: PublicKey,
    options?: Options
  ): Promise<SunriseStakeClient>;
}
