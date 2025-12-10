import {SunriseStakeClient} from "../client/src/index.js";
import "./util";
import {AnchorProvider, Wallet} from "@coral-xyz/anchor";
import BN from "bn.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {Authorized, Connection, Keypair, LAMPORTS_PER_SOL, StakeProgram} from "@solana/web3.js";
import bs58 from 'bs58';
import {blazeWithdrawSol} from "../client/src/blaze.js";

async function createStakeAccount({
                                      connection,
                                      wallet,
                                      stakeAccount,
                                      lamports
                                  }: {
    connection: Connection,
    wallet: Wallet,
    stakeAccount: Keypair,
    lamports?: number }) {
    console.log("Wallet: ", wallet.publicKey.toBase58());
    const transaction = StakeProgram.createAccount({
        fromPubkey: wallet.publicKey,
        stakePubkey: stakeAccount.publicKey,
        authorized: new Authorized(wallet.publicKey, wallet.publicKey),
        lamports: lamports ?? LAMPORTS_PER_SOL
    });
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.sign(stakeAccount);

    const signedTransaction = await wallet.signTransaction(transaction);

    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    console.log("Stake Account creation transaction sent", signature);
    const result = await connection.confirmTransaction({
        lastValidBlockHeight,
        blockhash,
        signature
    });
    if (result.value.err) throw new Error(`Failed to confirm transaction: ${result.value.err}`);
    console.log("Stake Account created", signature);
}

(async () => {
    const amount = new BN(process.argv[2]);
    console.log("Withdrawing ", amount.toString(), " lamports from Blaze component of the Stake Pool");
    const provider = AnchorProvider.env();
    const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet');

    const newStakeAccount = Keypair.generate();
    await createStakeAccount({
        connection: provider.connection,
        wallet: provider.wallet as Wallet,
        stakeAccount: newStakeAccount,
        lamports: 0
    });
    console.log("New stake account: ", newStakeAccount.publicKey.toBase58());
    console.log("New stake account secret key: ", bs58.encode(newStakeAccount.secretKey));

    const txSig = await client.withdrawStakeFromBlaze(newStakeAccount.publicKey, new BN(process.argv[2]));


    console.log("Withdraw tx sig: ", txSig);
})().catch(console.error);
