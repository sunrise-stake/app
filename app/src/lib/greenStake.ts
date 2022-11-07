import {Balance, GreenStakeClient} from "./client";
import {Connection, PublicKey, TokenAmount} from "@solana/web3.js";
import {ConnectedWallet} from "./util";
import {AnchorProvider, Wallet} from "@project-serum/anchor";
import BN from "bn.js";

const GREEN_STAKE_STATE = new PublicKey(process.env.REACT_APP_TREASURY_PUBLIC_KEY || '');

export type BalanceInfo = Balance & {
    msolValue: number
    earnedLamports: number
}

export class GreenStake {
    constructor(private client: GreenStakeClient){}

    static async init(connection: Connection, wallet: ConnectedWallet) {
        const provider = new AnchorProvider(connection, wallet as unknown as Wallet, {});
        const client = await GreenStakeClient.get(provider, GREEN_STAKE_STATE);
        client.details().then(console.log);
        return new GreenStake(client);
    }

    async getBalance():Promise<BalanceInfo> {
        const balance = await this.client.getBalance();
        const msolValue = balance.msolPrice * (balance.msolBalance.uiAmount || 0)
        const earnedLamports = msolValue - (balance.depositedSol.uiAmount || 0);

        return {
            ...balance,
            msolValue,
            earnedLamports
        }
    }

    deposit(amount: BN): Promise<string> {
        return this.client.deposit(amount);
    }

    withdraw(): Promise<string> {
        return this.client.withdraw();
    }

    treasuryBalance():Promise<number> {
        if (!this.client.config) throw new Error("Client not initialized");
        return this.client.provider.connection.getBalance(this.client.config.treasury);
    }
}