import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/stakeAccount";
import { AnchorProvider } from "@project-serum/anchor";

const newliqPoolProportion = parseInt(process.argv[2], 10);

console.log("Setting new LP Proportion to", newliqPoolProportion);

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
  await client.update({ newliqPoolProportion });
})().catch(console.error);
