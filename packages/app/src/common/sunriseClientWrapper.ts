import {
  SunriseStakeClient,
  type TicketAccount,
  type Details,
  MINIMUM_EXTRACTABLE_YIELD,
  type WithdrawalFees,
  type Environment,
} from "@sunrisestake/client";
import { type Connection, type PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import type BN from "bn.js";
import { type AnchorWallet } from "@solana/wallet-adapter-react";
import { debounce } from "./utils";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const stage =
  (process.env.REACT_APP_SOLANA_NETWORK as keyof typeof Environment) ??
  WalletAdapterNetwork.Devnet;

export class SunriseClientWrapper {
  public debouncedUpdate = debounce(this.triggerUpdate.bind(this), 1000);
  constructor(
    private readonly client: SunriseStakeClient,
    private readonly detailsListener: ((details: Details) => void) | undefined,
    readonly readonlyWallet: boolean
  ) {
    const accountsToListenTo = [
      this.client.provider.publicKey,
      this.client.stakerGSolTokenAccount,
      this.client.config?.gsolMint,
      // this.client.marinadeState?.lpMint.address, // Remove this as it might get too noisy
      this.client.msolTokenAccount,
    ];

    // TODO too noisy?
    accountsToListenTo.forEach((account) => {
      if (account != null) {
        this.client.provider.connection.onAccountChange(account, () => {
          this.debouncedUpdate();
        });
      }
    });
  }

  private triggerUpdate(): void {
    console.log("Updating details");
    this.client.details().then(this.detailsListener).catch(console.error);
  }

  static async init(
    connection: Connection,
    wallet: AnchorWallet,
    listener?: (details: Details) => void,
    readonlyWallet = false
  ): Promise<SunriseClientWrapper> {
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as AnchorWallet,
      {}
    );
    const client = await SunriseStakeClient.get(provider, stage, {
      verbose: Boolean(process.env.REACT_APP_VERBOSE),
    });

    return new SunriseClientWrapper(client, listener, readonlyWallet);
  }

  private readonly triggerUpdateAndReturn = <T>(result: T): T => {
    this.debouncedUpdate();
    return result;
  };

  async deposit(amount: BN): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .makeBalancedDeposit(amount)
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx))
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async withdraw(amount: BN): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .unstake(amount)
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx))
      .then(this.triggerUpdateAndReturn.bind(this));
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

  async lockGSol(amount: BN): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .lockGSol(amount)
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx))
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async unlockGSol(): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .unlockGSol()
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx))
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async updateLockAccount(): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .updateLockAccount()
      .then(async (tx) => this.client.sendAndConfirmTransaction(tx));
  }

  internal(): SunriseStakeClient {
    return this.client;
  }
}
