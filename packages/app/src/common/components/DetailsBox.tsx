import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { type Details, toSol } from "@sunrisestake/client";
import BN from "bn.js";
import clx from "classnames";
import { type FC, type ReactNode, useRef, useState } from "react";

import { tooltips } from "../content/tooltips";
import { toFixedWithPrecision } from "../utils";
import { TooltipPopover } from "./TooltipPopover";

interface DetailEntryProps {
  label: string;
  value: string;
  tooltip: ReactNode;
  share?: number;
}
const DetailEntry: FC<DetailEntryProps> = ({
  label,
  value,
  share,
  tooltip,
}) => (
  <div className="flex flex-row justify-between">
    <div className="flex flex-row gap-2">
      <div className="text-sm sm:text-lg">{label}</div>
      <TooltipPopover>{tooltip}</TooltipPopover>
    </div>
    <div className="font-bold text-sm sm:text-lg">
      {value} <span className="text-bold text-xs">SOL</span>{" "}
      {share !== undefined && (
        <span className="hidden sm:inline text-gray-300 font-normal text-sm">
          ({share}%)
        </span>
      )}
    </div>
  </div>
);

interface Props {
  className?: string;
  details: Details | undefined;
}
const DetailsBox: FC<Props> = ({ className, details }) => {
  const [isShowing, setIsShowing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  if (details == null) return <>Loading...</>;

  const inflightTotal = details.epochReport.totalOrderedLamports;

  const totalValue = details.mpDetails.msolValue
    .add(details.lpDetails.lpSolValue)
    .add(details.bpDetails.bsolValue)
    .add(inflightTotal);

  const mpShare =
    details.mpDetails.msolValue.muln(1_000).div(totalValue).toNumber() / 10;
  const bpShare =
    details.bpDetails.bsolValue.muln(1_000).div(totalValue).toNumber() / 10;
  const lpShare =
    details.lpDetails.lpSolValue.muln(1_000).div(totalValue).toNumber() / 10;
  const inflightShare =
    inflightTotal.muln(1_000).div(totalValue).toNumber() / 10;

  const extractableYield = new BN(
    Math.max(details.extractableYield.toNumber(), 0)
  );
  const yieldShare =
    extractableYield.muln(1_000).div(totalValue).toNumber() / 10;
  const gSolSupply = new BN(details.balances.gsolSupply.amount);

  const lamportsToDisplay = (lamports: BN): string =>
    toFixedWithPrecision(toSol(lamports), 2);

  return (
    <>
      <button
        onClick={() => {
          setIsShowing((isShowing) => {
            clearTimeout(timeoutRef.current);
            if (isShowing) {
              setIsVisible(false);
            } else {
              timeoutRef.current = setTimeout(() => {
                setIsVisible(true);
              }, 700);
            }
            return !isShowing;
          });
        }}
        className={clx(
          "transition duration-700 flex w-full justify-between rounded-t-md px-4 py-1 bg-green text-left text-sm font-medium text-white ",
          {
            "rounded-t-md backdrop-blur-sm": isShowing,
            "rounded-md": !isShowing,
          }
        )}
      >
        <span>Details</span>
        <ChevronDownIcon
          className={clx("transition duration-700 h-5 w-5 text-white", {
            "rotate-180 transform": isShowing,
          })}
        />
      </button>

      <div
        className={clx(
          "transition-all duration-1000 py-2 px-4 rounded-b-md text-center overflow-y-hidden",
          {
            "transform h-48 backdrop-blur-sm": isShowing,
            "transform h-0": !isShowing,
            "overflow-y-visible": isVisible,
          },
          className
        )}
      >
        <hr
          className={clx(
            "-mt-1 h-{0.5px} transition-all duration-700 mb-2 w-full bg-white",
            {
              "transform opacity-0": !isShowing,
              "transform opacity-100": isShowing,
            }
          )}
        ></hr>
        <DetailEntry
          label="Total gSOL"
          value={lamportsToDisplay(gSolSupply)}
          share={100}
          tooltip={tooltips.totalStake}
        />
        <DetailEntry
          label="Marinade Stake Pool Value"
          value={lamportsToDisplay(details.mpDetails.msolValue)}
          share={mpShare}
          tooltip={tooltips.marinadeStakePool}
        />
        <DetailEntry
          label="Marinade Liquidity Pool Value"
          value={lamportsToDisplay(details.lpDetails.lpSolValue)}
          share={lpShare}
          tooltip={tooltips.marinadeLiquidityPool}
        />
        <DetailEntry
          label="SolBlaze Stake Pool Value"
          value={lamportsToDisplay(details.bpDetails.bsolValue)}
          share={bpShare}
          tooltip={tooltips.solblazeStakePool}
        />
        <DetailEntry
          label="In-flight Value"
          value={lamportsToDisplay(inflightTotal)}
          share={inflightShare}
          tooltip={tooltips.inflight}
        />
        <DetailEntry
          label="Extractable Yield"
          value={lamportsToDisplay(extractableYield)}
          share={yieldShare}
          tooltip={tooltips.extractableYield}
        />
      </div>
    </>
  );
};

export { DetailsBox };
