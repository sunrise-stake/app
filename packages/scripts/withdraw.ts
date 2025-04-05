import { SunriseStakeClient } from "../client/src/index.js";
import "./util";
import { AnchorProvider } from "@coral-xyz/anchor";
import BN from "bn.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet');
  const txSig = await client.unstake(new BN(process.argv[2]));

  console.log("Withdraw tx sig: ", txSig);
})().catch(console.error);
