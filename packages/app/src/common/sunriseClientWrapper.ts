import {
  SunriseStakeClient,
  type TicketAccount,
  type Details,
  MINIMUM_EXTRACTABLE_YIELD,
  type WithdrawalFees,
  type Environment,
} from "@sunrisestake/client";
import {
  type Connection,
  PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import type BN from "bn.js";
import { type AnchorWallet } from "@solana/wallet-adapter-react";
import { debounce } from "./utils";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

// TODO remove once this is exported from the client
const PROGRAM_ID = new PublicKey("sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6");
const isDepositIx = (ix: TransactionInstruction): boolean =>
  ix.programId.equals(PROGRAM_ID);

const stage =
  (process.env.REACT_APP_SOLANA_NETWORK as keyof typeof Environment) ??
  WalletAdapterNetwork.Devnet;

const addReferrer = (): ((tx: Transaction) => Transaction) => {
  const urlParams = new URLSearchParams(window.location.search);
  const referrerString = urlParams.get("referrer");
  const referrer =
    referrerString !== null ? new PublicKey(referrerString) : undefined;
  if (!referrer) return (tx: Transaction) => tx;

  return (tx: Transaction) => {
    const depositInstruction = tx.instructions.find(isDepositIx);
    if (depositInstruction) {
      depositInstruction.keys.push({
        pubkey: referrer,
        isSigner: false,
        isWritable: false,
      });
    }
    return tx;
  };
};

export class SunriseClientWrapper {
  constructor(
    private readonly client: SunriseStakeClient,
    private readonly detailsListener:
      | ((details: Details, accountChanged?: PublicKey) => void)
      | undefined,

    private readonly accountListener:
      | ((accountChanged?: PublicKey) => void)
      | undefined,
    private readonly loadingListener: ((loading: boolean) => void) | undefined,
    readonly readonlyWallet: boolean
  ) {
    const accountsToListenTo = [
      this.client.provider.publicKey,
      this.client.stakerGSolTokenAccount,
      // this.client.config?.gsolMint,
      // this.client.msolTokenAccount,
    ];

    accountsToListenTo.forEach((account) => {
      if (account !== undefined) {
        this.client.provider.connection.onAccountChange(account, () => {
          this.debouncedUpdate(account);
        });
      }
    });
  }

  public debouncedUpdate = debounce((account?: PublicKey) => {
    console.log("TRIGGER UPDATE");
    this.triggerUpdate(account);
  }, 5000);

  private triggerUpdate(changedAccount?: PublicKey): void {
    this.loadingListener?.(true);
    this.accountListener?.(changedAccount);
    this.client
      .details()
      .then((details) => {
        this.detailsListener?.(details, changedAccount);
      })
      .catch(console.error)
      .finally(() => {
        this.loadingListener?.(false);
      });
  }

  static async init(
    connection: Connection,
    wallet: AnchorWallet,
    detailsListener?: (details: Details, changedAccount?: PublicKey) => void,
    accountListener?: (changedAccount?: PublicKey) => void,
    loadingListener?: (loading: boolean) => void,
    readonlyWallet = false
  ): Promise<SunriseClientWrapper> {
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as AnchorWallet,
      {}
    );
    const client = await SunriseStakeClient.get(provider, stage, {
      verbose: Boolean(process.env.REACT_APP_VERBOSE),
      addPriorityFee: process.env.REACT_APP_ADD_PRIO_FEE === "true",
    });

    return new SunriseClientWrapper(
      client,
      detailsListener,
      accountListener,
      loadingListener,
      readonlyWallet
    );
  }

  private readonly triggerUpdateAndReturn = <T>(result: T): T => {
    this.debouncedUpdate();
    return result;
  };

  async deposit(amount: BN, recipient?: PublicKey): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .makeBalancedDeposit(amount, recipient)
      .then(addReferrer())
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx));
    // .then(this.triggerUpdateAndReturn.bind(this));
  }

  async withdraw(amount: BN): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .unstake(amount)
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx));
    // .then(this.triggerUpdateAndReturn.bind(this));
  }

  async orderWithdrawal(amount: BN): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .orderUnstake(amount)
      .then(async ([tx, keypairs]) =>
        this.client.sendAndConfirmTransaction(tx, keypairs)
      )
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async getDelayedUnstakeTickets(): Promise<TicketAccount[]> {
    return this.client.getDelayedUnstakeTickets();
  }

  calculateWithdrawalFee(amount: BN, details: Details): WithdrawalFees {
    return this.client.calculateWithdrawalFee(amount, details);
  }

  async claimUnstakeTicket(ticket: TicketAccount): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .claimUnstakeTicket(ticket)
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx))
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async getDetails(): Promise<Details> {
    console.log("SunriseClientWrapper.getDetails");
    return this.client.details();
  }

  async executeCrankOperations(): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    const instructions = [];

    const { extractableYield } = await this.client.details();

    if (extractableYield.gtn(MINIMUM_EXTRACTABLE_YIELD)) {
      const extractYieldIx = await this.client.extractYieldIx();
      instructions.push(extractYieldIx);
    }

    // TODO add treasuryController crank function

    const tx = new Transaction().add(...instructions);

    return this.client.provider
      .sendAndConfirm(tx, [])
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  get holdingAccount(): PublicKey {
    return this.client.env.holdingAccount;
  }

  get yieldControllerState(): PublicKey {
    return this.client.env.yieldControllerState;
  }

  async lockGSol(amount: BN): Promise<string[]> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .lockGSol(amount)
      .then(async (txes) =>
        this.client.sendAndConfirmTransactions(txes, undefined, undefined, true)
      )
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async unlockGSol(): Promise<string[]> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .unlockGSol()
      .then(async (txes) => this.client.sendAndConfirmTransactions(txes))
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async updateLockAccount(): Promise<string[]> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .updateLockAccount()
      .then(async (txes) =>
        this.client.sendAndConfirmTransactions(txes, undefined, undefined, true)
      );
  }

  internal(): SunriseStakeClient {
    return this.client;
  }
}
