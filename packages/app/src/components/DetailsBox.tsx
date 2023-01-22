import clx from "classnames";
import { FC, useState } from "react";
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
    <div className="text-gray-100 text-sm sm:text-lg">{label}</div>
    <div className="font-bold text-sm sm:text-lg">
      {value} <span className="text-bold text-xs">SOL</span>{" "}
      {share !== undefined && (
        <span className="hidden sm:inline">({share}%)</span>
      )}
    </div>
  </div>
);

interface Props {
  className?: string;
}
const DetailsBox: FC<Props> = ({ className }) => {
  const [show, setShow] = useState(false);

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
    toFixedWithPrecision(toSol(lamports), 2);

  return (
    <>
      <div
        className="text-gray-400 -mb-5 cursor-pointer hover:text-gray-300 w-fit"
        onClick={() => setShow((prevState) => !prevState)}
      >
        Details
      </div>
      {show && (
        <div
          className={clx(
            "bg-green-light/30 border border-green-light backdrop-blur-md py-2 px-4 rounded text-center",
            className
          )}
        >
          <DetailEntry
            label="Marinade Stake Pool Value"
            value={lamportsToDisplay(details.spDetails.msolValue)}
            share={spShare}
          />
          <DetailEntry
            label="Marinade Liquidity Pool Value"
            value={lamportsToDisplay(details.lpDetails.lpSolValue)}
            share={lpShare}
          />
          <DetailEntry
            label="In Flight Value"
            value={lamportsToDisplay(inflightTotal)}
            share={inflightShare}
          />
        </div>
      )}
    </>
  );
};

export { DetailsBox };
