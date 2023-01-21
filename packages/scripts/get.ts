import { SunriseStakeClient } from "../app/src/lib/client/";
import "./util";
import { AnchorProvider } from "@project-serum/anchor";
import { SUNRISE_STAKE_STATE } from "@sunrisestake/app/src/lib/constants";
import { toSol, ZERO } from "@sunrisestake/app/src/lib/util";

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
  const details = await client.details();

  if (!client.config) throw new Error("No config");

  const totalValue = details.spDetails.msolValue.add(
    details.lpDetails.lpSolValue
  );
  const spShare = details.spDetails.msolValue.muln(100).div(totalValue);
  const lpShare = details.lpDetails.lpSolValue.muln(100).div(totalValue);

  const report: Record<string, string> = {
    "gSOL Supply": details.balances.gsolSupply.uiAmountString ?? "-",
    "Stake Pool Value": `${toSol(
      details.spDetails.msolValue
    )} (${spShare.toString()}%)`,
    "Liquidity Pool Value": `${toSol(
      details.lpDetails.lpSolValue
    )} (${lpShare.toString()}%)`,
    "Total Value": totalValue.toString(),
    "Open Orders": `${details.inflight.reduce((acc, x) => acc + x.tickets, 0)}`,
    "Open Order value (Current Epoch)": `${toSol(
      details.inflight[0].totalOrderedLamports ?? ZERO
    )}`,
    "Open Order value (Previous Epoch)": `${toSol(
      details.inflight[1].totalOrderedLamports ?? ZERO
    )}`,
    "Extractable Yield": `${toSol(details.extractableYield)}`,
  };

  console.log({
    config: client.config,
    details,
  });

  Object.keys(report).forEach((key) => {
    console.log(key, ":", report[key]);
  });
})().catch(console.error);
