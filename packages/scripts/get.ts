import { SunriseStakeClient, SUNRISE_STAKE_STATE } from "@sunrisestake/client";
import "./util";
import { AnchorProvider } from "@project-serum/anchor";
import { toSol, ZERO } from "@sunrisestake/app/src/lib/util";
import BN from "bn.js";

(async () => {
  const provider = AnchorProvider.env();
  const client = await SunriseStakeClient.get(provider, SUNRISE_STAKE_STATE);
  const details = await client.details();

  if (!client.config) throw new Error("No config");

  const inflightTotal = details.inflight.reduce(
    (acc, x) => acc.add(x.totalOrderedLamports),
    ZERO
  );

  const totalValue = details.mpDetails.msolValue
    .add(details.bpDetails.bsolValue)
    .add(details.lpDetails.lpSolValue)
    .add(inflightTotal);

  const mpShare =
    details.mpDetails.msolValue.muln(10_000).div(totalValue).toNumber() / 100;
  const bpShare =
    details.bpDetails.bsolValue.muln(10_000).div(totalValue).toNumber() / 100;
  const lpShare =
    details.lpDetails.lpSolValue.muln(10_000).div(totalValue).toNumber() / 100;
  const inflightShare =
    inflightTotal.muln(10_000).div(totalValue).toNumber() / 100;

  const missingValue = totalValue.sub(
    new BN(details.balances.gsolSupply.amount)
  );
  const missingValueShare =
    missingValue.muln(10_000).div(totalValue).toNumber() / 100;

  const report: Record<string, string> = {
    "gSOL Supply": details.balances.gsolSupply.uiAmountString ?? "-",
    "Marinade Stake Pool Value": `${toSol(
      details.mpDetails.msolValue
    )} (${mpShare.toString()}%)`,
    "SolBlaze Stake Pool Value": `${toSol(
      details.bpDetails.bsolValue
    )} (${bpShare.toString()}%)`,
    "Liquidity Pool Value": `${toSol(
      details.lpDetails.lpSolValue
    )} (${lpShare.toString()}%)`,
    "Total Value": `${toSol(totalValue)}`,
    "Open Orders": `${details.inflight.reduce((acc, x) => acc + x.tickets, 0)}`,
    "Open Order value (Current Epoch)": `${toSol(
      details.inflight[0].totalOrderedLamports ?? ZERO
    )}`,
    "Open Order value (Previous Epoch)": `${toSol(
      details.inflight[1].totalOrderedLamports ?? ZERO
    )}`,
    "Open Order value (Total)": `${toSol(
      inflightTotal
    )} (${inflightShare.toString()}%)`,
    "Extractable Yield (calculated)": `${toSol(
      missingValue
    )} (${missingValueShare.toString()}%)`,
    "Extractable Yield": `${toSol(details.extractableYield)}`,
  };

  Object.keys(report).forEach((key) => {
    console.log(key, ":", report[key]);
  });
})().catch(console.error);
