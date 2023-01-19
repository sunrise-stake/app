import { SunriseStakeClient } from "./client";
import { Connection, Transaction } from "@solana/web3.js";
import { ConnectedWallet, toBN } from "./util";
import { AnchorProvider, Wallet } from "@project-serum/anchor";
import BN from "bn.js";
import { Environment, MINIMUM_EXTRACTABLE_YIELD } from "./constants";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { TicketAccount } from "./client/types/TicketAccount";
import { Balance } from "./client/util";
import { Details } from "./client/types/Details";

export const SUNRISE_STAKE_STATE =
  Environment[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ].state;

export type BalanceInfo = Balance & {
  msolValue: BN;
  extractableYield: BN;
};

export class SunriseClientWrapper {
  constructor(
    private readonly client: SunriseStakeClient,
    private readonly detailsListener: (details: Details) => void
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
          this.client.details().then(detailsListener).catch(console.error);
        });
      }
    });
  }

  static async init(
    connection: Connection,
    wallet: ConnectedWallet,
    listener: (details: Details) => void
  ): Promise<SunriseClientWrapper> {
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as Wallet,
      {}
    );
    const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE, {
      verbose: Boolean(process.env.REACT_APP_VERBOSE),
    });

    return new SunriseClientWrapper(client, listener);
  }

  async deposit(amount: BN): Promise<string> {
    return this.client.deposit(amount);
  }

  async withdraw(amount: BN): Promise<string> {
    return this.client.unstake(amount);
  }

  async orderWithdrawal(amount: BN): Promise<string> {
    return this.client.orderUnstake(amount).then(([txSig]) => txSig);
  }

  async getDelayedUnstakeTickets(): Promise<TicketAccount[]> {
    return this.client.getDelayedUnstakeTickets();
  }

  async claimUnstakeTicket(ticket: TicketAccount): Promise<string> {
    return this.client.claimUnstakeTicket(ticket);
  }

  async getDetails(): Promise<Details> {
    return this.client.details();
  }

  async treasuryBalance(): Promise<BN> {
    if (!this.client.config) throw new Error("Client not initialized");
    return this.client.provider.connection
      .getBalance(this.client.config.treasury)
      .then(toBN);
  }

  async executeCrankOperations(): Promise<string> {
    const instructions = [];

    const { extractableYield } = await this.client.details();

    if (extractableYield.gtn(MINIMUM_EXTRACTABLE_YIELD)) {
      const extractYieldIx = await this.client.extractYieldIx();
      instructions.push(extractYieldIx);
    }

    // TODO add treasuryController crank function

    const tx = new Transaction().add(...instructions);

    return this.client.provider.sendAndConfirm(tx, []);
  }
}
