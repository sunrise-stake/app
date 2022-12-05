import { Balance, SunriseStakeClient } from "./client";
import { Connection } from "@solana/web3.js";
import { ConnectedWallet, toBN } from "./util";
import { AnchorProvider, Wallet } from "@project-serum/anchor";
import BN from "bn.js";
import { Environment } from "./constants";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const SUNRISE_STAKE_STATE =
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
    const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
    client.details().then(console.log).catch(console.error);
    return new StakeAccount(client);
  }

  async getBalance(): Promise<BalanceInfo> {
    const balance = await this.client.getBalance();
    const msolValue = new BN(
      new BN(balance.msolBalance.amount).toNumber() * balance.msolPrice
    );
    const stake = msolValue.sub(new BN(balance.depositedSol.amount ?? 0));

    console.log({ balance, msolValue, stake });

    console.log("msolBalance", balance.msolBalance.amount);
    console.log("msolPrice", balance.msolPrice);
    console.log("msolValue", msolValue.toString());
    console.log("earned lamports", stake.toNumber());

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

  async treasuryBalance(): Promise<BN> {
    if (!this.client.config) throw new Error("Client not initialized");
    return this.client.provider.connection
      .getBalance(this.client.config.treasury)
      .then(toBN);
  }
}
