import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { AnchorProvider } from "@project-serum/anchor";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/constants";

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
  const details = await client.details();
  console.log({
    config: client.config,
    details,
  });
})().catch(console.error);
