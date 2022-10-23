import {Marinade, MarinadeConfig} from '@marinade.finance/marinade-ts-sdk'
import {Connection} from "@solana/web3.js";
import BN from "bn.js";
import { Token, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {ConnectedWallet} from "./util";

export class MarinadeClient {
    private marinade: Marinade;

    constructor(readonly connection: Connection, readonly wallet: ConnectedWallet) {
        const config = new MarinadeConfig({
            connection,
            publicKey: wallet.publicKey
        })
        this.marinade = new Marinade(config)
    }

    public async deposit(amountLamports: BN):Promise<string> {
        const { transaction } = await this.marinade.deposit(amountLamports)

        return this.wallet.sendTransaction(transaction, this.connection);
    }

    public async withdraw(amountLamports: BN):Promise<string> {
        const { transaction } = await this.marinade.liquidUnstake(amountLamports);

        return this.wallet.sendTransaction(transaction, this.connection, { skipPreflight: true });
    }

    public async getBalance():Promise<BN> {
        const state = await this.marinade.getMarinadeState()
        const mSolToken = state.mSolMint.mintClient()
        const ata = await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID,
            mSolToken.publicKey, this.wallet.publicKey
        );

        const ataAccount = await mSolToken.getAccountInfo(ata);
        if (!ataAccount) return new BN(0);

        return ataAccount.amount;
    }

}