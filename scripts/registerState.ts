import {SunriseStakeClient} from "../app/src/lib/client/";
import {PublicKey} from "@solana/web3.js";
import './util'

const treasuryKey = new PublicKey(process.env.TREASURY_KEY);

( async () => {
    const client = await SunriseStakeClient.register(treasuryKey);
    await client.details().then(console.log);
})().catch(console.error);