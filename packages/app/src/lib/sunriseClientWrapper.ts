import { SunriseStakeClient } from "./client";
import { Connection, Transaction } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";
import BN from "bn.js";
import {
  Environment,
  MINIMUM_EXTRACTABLE_YIELD,
  SolBlazeConstants,
} from "./constants";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { TicketAccount } from "./client/types/TicketAccount";
import { Details } from "./client/types/Details";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { debounce } from "./util";

export const SUNRISE_STAKE_STATE =
  Environment[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ].state;

export const SOLBLAZE_CONFIG =
  SolBlazeConstants[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ];

export class SunriseClientWrapper {
  public debouncedUpdate = debounce(this.triggerUpdate.bind(this), 1000);
  constructor(
    private readonly client: SunriseStakeClient,
    private readonly detailsListener: (details: Details) => void,
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
      if (account) {
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
    listener: (details: Details) => void,
    readonlyWallet = false
  ): Promise<SunriseClientWrapper> {
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as AnchorWallet,
      {}
    );
    const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE, {
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
      .deposit(amount)
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async withdraw(amount: BN): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .unstake(amount)
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async orderWithdrawal(amount: BN): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .orderUnstake(amount)
      .then(([txSig]) => txSig)
      .then(this.triggerUpdateAndReturn.bind(this));
  }

  async getDelayedUnstakeTickets(): Promise<TicketAccount[]> {
    return this.client.getDelayedUnstakeTickets();
  }

  calculateWithdrawalFee(amount: BN, details: Details): BN {
    return this.client.calculateWithdrawalFee(amount, details);
  }

  async claimUnstakeTicket(ticket: TicketAccount): Promise<string> {
    if (this.readonlyWallet) throw new Error("Readonly wallet");
    return this.client
      .claimUnstakeTicket(ticket)
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
}
