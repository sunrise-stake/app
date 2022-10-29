import {GreenStakeClient} from "../tests/lib/client";
import {Keypair, PublicKey} from "@solana/web3.js";
import "./util";
import * as anchor from "@project-serum/anchor";
import {AnchorProvider} from "@project-serum/anchor";

const [stateAddress] = process.argv.slice(2);

( async () => {
    const provider = AnchorProvider.env();

    const client = await GreenStakeClient.get(provider, new PublicKey(stateAddress));
    const txSig = await client.withdraw();

    console.log("Withdraw tx sig: ", txSig);
})().catch(console.error);