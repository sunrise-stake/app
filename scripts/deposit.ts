import {GreenStakeClient} from "../app/src/lib/client/";
import {PublicKey} from "@solana/web3.js";
import "./util";
import {AnchorProvider} from "@project-serum/anchor";
import BN from "bn.js";

const [stateAddress, amountStr] = process.argv.slice(2);

( async () => {
    const provider = AnchorProvider.env();

    const client = await GreenStakeClient.get(provider, new PublicKey(stateAddress));
    await client.createGSolTokenAccount()
    const txSig = await client.deposit(new BN(amountStr));

    console.log("Deposit tx sig: ", txSig);
})().catch(console.error);