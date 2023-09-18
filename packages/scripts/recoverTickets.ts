import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import {AnchorProvider} from "@coral-xyz/anchor";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {Transaction} from "@solana/web3.js";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet', {
    verbose: true
  });

  const recoverIx = await client.recoverTickets();

  if (!recoverIx) {
    console.log("No action to perform");
    return;
  }

  // const txSig = await client.sendAndConfirmTransaction(
  //     new Transaction().add(recoverIx)
  // );
  //
  // console.log("Action complete:", txSig)
})().catch(console.error);
