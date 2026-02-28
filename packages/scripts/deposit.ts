import {SunriseStakeClient} from "../client/src/index.js";
import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import BN from "bn.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

const [amountStr] = process.argv.slice(2);

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(
    provider,
      process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet',
  );
  const tx = await client.deposit(new BN(amountStr));
  const txSig = await client.sendAndConfirmTransaction(tx);

  console.log("Deposit tx sig: ", txSig);
})().catch(console.error);
