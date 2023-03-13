import { SunriseStakeClient } from "../client/";
import "./util";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

// const newliqPoolProportion = parseInt(process.argv[2], 10);
//
// console.log("Setting new LP Proportion to", newliqPoolProportion);

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(
      provider,
      process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork || 'devnet',
      {
        verbose: true,
      });
  await client.update({
    newTreasury: new PublicKey("F7P4qYbVKFiiD4dQpwwVS6ao22DLr2sAF7Z3cCHneC8w"),
  });
})().catch(console.error);
