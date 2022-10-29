import {GreenStakeClient} from "../tests/lib/client";
import {Keypair, PublicKey} from "@solana/web3.js";
import "./util";
import * as anchor from "@project-serum/anchor";
import {AnchorProvider} from "@project-serum/anchor";

const [stateAddress, amountStr] = process.argv.slice(2);

( async () => {
    const provider = AnchorProvider.env();

    const client = await GreenStakeClient.get(provider, new PublicKey(stateAddress));
    await client.createGSolTokenAccount()
    const txSig = await client.deposit(Number(amountStr));

    console.log("Deposit tx sig: ", txSig);
})().catch(console.error);