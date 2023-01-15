import { SunriseStakeClient } from "./client";
import { Connection } from "@solana/web3.js";
import { ConnectedWallet, toBN } from "./util";
import { AnchorProvider, Wallet } from "@project-serum/anchor";
import BN from "bn.js";
import { Environment } from "./constants";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { TicketAccount } from "./client/types/TicketAccount";
import {Balance} from "./client/util";

export const SUNRISE_STAKE_STATE =
  Environment[
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
      WalletAdapterNetwork.Devnet
  ].state;

export type BalanceInfo = Balance & {
  msolValue: BN;
  earnedLamports: BN;
};

export class StakeAccount {
  constructor(private readonly client: SunriseStakeClient) {}

  static async init(
    connection: Connection,
    wallet: ConnectedWallet
  ): Promise<StakeAccount> {
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as Wallet,
      {}
    );
    const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE, {
      verbose: !!process.env.REACT_APP_VERBOSE
    });
    client.details().then(console.log).catch(console.error);
    return new StakeAccount(client);
  }

  async getBalance(): Promise<BalanceInfo> {
    const balance = await this.client.getBalance();
    const msolValue = new BN(
      new BN(balance.msolBalance.amount).toNumber() * balance.msolPrice
    );
    const stake = msolValue.sub(new BN(balance.totalDepositedSol.amount ?? 0));

    console.log({ balance, msolValue, stake });

    console.log("msolBalance", balance.msolBalance.amount);
    console.log("msolPrice", balance.msolPrice);
    console.log("msolValue", msolValue.toString());
    console.log("earned lamports", stake.toNumber());
    console.log("total deposited sol", balance.totalDepositedSol.amount);

    return {
      ...balance,
      msolValue,
      earnedLamports: stake,
    };
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

  async treasuryBalance(): Promise<BN> {
    if (!this.client.config) throw new Error("Client not initialized");
    return this.client.provider.connection
      .getBalance(this.client.config.treasury)
      .then(toBN);
  }
}
