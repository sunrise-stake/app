import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { AnchorProvider } from "@project-serum/anchor";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/stakeAccount";
import BN from "bn.js";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
  const txSig = await client.unstake(new BN(process.argv[2]));

  console.log("Withdraw tx sig: ", txSig);
})().catch(console.error);
