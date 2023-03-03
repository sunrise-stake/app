import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { AnchorProvider } from "@coral-xyz/anchor";
import BN from "bn.js";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/constants";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
  const txSig = await client.unstake(new BN(process.argv[2]));

  console.log("Withdraw tx sig: ", txSig);
})().catch(console.error);
