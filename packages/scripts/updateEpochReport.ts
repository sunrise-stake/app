import { SunriseStakeClient } from "../client/src/index.js";
import "./util.js";
import {AnchorProvider} from "@coral-xyz/anchor";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet');

  await client.updateEpochReport();
})().catch(console.error);
