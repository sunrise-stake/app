import "./util.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {SunriseStakeClient} from "../client/src/index.js";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet');
  const txSig = await client.triggerRebalance();

  console.log("Rebalance tx sig: ", txSig);
})().catch(console.error);
