import {SunriseStakeClient} from "../client/src/index.js";
import "./util.js";
import {AnchorProvider} from "@coral-xyz/anchor";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {readOnlyProvider, recursiveToString} from "./util.js";
import {PublicKey} from "@solana/web3.js";

const getProvider = () => {
    if (process.argv.length < 3) {
        return AnchorProvider.env();
    }

    const pubkeyString = process.argv[2];
    return readOnlyProvider(new PublicKey(pubkeyString));
}

(async () => {
  const provider = getProvider();
  const client = await SunriseStakeClient.get(
      provider,
      process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet',
      {
        verbose: true,
      });

  if (process.env.VERBOSE) console.log("Config:", recursiveToString(await client.config));
  if (process.env.VERBOSE) console.log("Details", recursiveToString(await client.details()));

  await client.report();
})().catch(console.error);
