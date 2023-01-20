import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { AnchorProvider } from "@project-serum/anchor";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/sunriseClientWrapper";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);

  console.log(await client.details());

  const txSig = await client.extractYield();

  console.log("Extract tx sig: ", txSig);
})().catch(console.error);
