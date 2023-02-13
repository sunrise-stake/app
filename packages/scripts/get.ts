import {SunriseStakeClient} from "../client/src";
import "./util";
import { AnchorProvider } from "@project-serum/anchor";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet');

  await client.report();
})().catch(console.error);
