import clx from "classnames";
import { FC } from "react";
import { useSunriseStake } from "../context/sunriseStakeContext";
import { toFixedWithPrecision, toSol, ZERO } from "../lib/util";
import BN from "bn.js";

interface DetailEntryProps {
  label: string;
  value: string;
  share?: number;
}
const DetailEntry: FC<DetailEntryProps> = ({ label, value, share }) => (
  <div className="flex flex-row justify-between">
    <div className="text-gray-400">{label}</div>
    <div className="font-bold text-xl">
      {value}
      {share !== undefined && <span>({share}%)</span>}
    </div>
  </div>
);

interface Props {
  className?: string;
}
const DetailsBox: FC<Props> = ({ className }) => {
  const { details } = useSunriseStake();

  if (!details) return <>Loading...</>;

  const inflightTotal = details.inflight.reduce(
    (acc, x) => acc.add(x.totalOrderedLamports),
    ZERO
  );

  const totalValue = details.spDetails.msolValue
    .add(details.lpDetails.lpSolValue)
    .add(inflightTotal);

  const spShare =
    details.spDetails.msolValue.muln(10_000).div(totalValue).toNumber() / 100;
  const lpShare =
    details.lpDetails.lpSolValue.muln(10_000).div(totalValue).toNumber() / 100;
  const inflightShare =
    inflightTotal.muln(10_000).div(totalValue).toNumber() / 100;

  const lamportsToDisplay = (lamports: BN): string =>
    toFixedWithPrecision(toSol(lamports));

  return (
    <div
      className={clx(
        "bg-green-light/30 border border-green-light backdrop-blur-md p-2 rounded text-center",
        className
      )}
    >
      <DetailEntry
        label="Marinade Stake Pool value"
        value={lamportsToDisplay(details.spDetails.msolValue)}
        share={spShare}
      />
      <DetailEntry
        label="Marinade Liquidity Pool value"
        value={lamportsToDisplay(details.lpDetails.lpSolValue)}
        share={lpShare}
      />
      <DetailEntry
        label="In flight value"
        value={lamportsToDisplay(inflightTotal)}
        share={inflightShare}
      />
    </div>
  );
};

export { DetailsBox };