import { SunriseStakeClient } from "../app/src/lib/client/";
import { PublicKey } from "@solana/web3.js";
import "./util";
import { AnchorProvider } from "@coral-xyz/anchor";
import BN from "bn.js";

const [stateAddress, amountStr] = process.argv.slice(2);

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(
    provider,
    new PublicKey(stateAddress)
  );
  const txSig = await client.deposit(new BN(amountStr));

  console.log("Deposit tx sig: ", txSig);
})().catch(console.error);
