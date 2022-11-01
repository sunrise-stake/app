import {GreenStakeClient} from "../app/src/lib/client/";
import {Keypair} from "@solana/web3.js";
import {idWallet} from "./util";

const treasuryKeyPath = process.env.TREASURY_KEY || idWallet;
const treasuryKey = Keypair.fromSecretKey(
    Buffer.from(require(treasuryKeyPath))
);

( async () => {
    const client = await GreenStakeClient.register(treasuryKey);
    await client.details().then(console.log);
})().catch(console.error);