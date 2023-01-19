import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/stakeAccount";
import { AnchorProvider } from "@project-serum/anchor";

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
  const details = await client.details();
  console.log({
    config: client.config,
    details,
  });
})().catch(console.error);
