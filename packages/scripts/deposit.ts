import {SunriseStakeClient} from "../client/src";
import "./util";
import { AnchorProvider } from "@coral-xyz/anchor";
import BN from "bn.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

const [stateAddress, amountStr] = process.argv.slice(2);

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(
    provider,
      process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet',
  );
  const txSig = await client.deposit(new BN(amountStr));

  console.log("Deposit tx sig: ", txSig);
})().catch(console.error);
