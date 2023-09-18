import { solToCarbon, toFixedWithPrecision, ZERO } from "../common/utils";
import { TooltipPopover } from "../common/components";
import { tooltips } from "../common/content/tooltips";
import React, { type FC, type PropsWithChildren } from "react";
import { toSol, type LockDetails } from "@sunrisestake/client";
import type BN from "bn.js";
import { getAdditionalYieldRequiredToNextLevel } from "./utils";

interface Props {
  lockDetails: LockDetails;
}

const LockDetailTag: FC<PropsWithChildren> = ({ children }) => (
  <span className="inline-flex gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
    {children}
  </span>
);

const hasLockedBalance = (details: LockDetails): boolean =>
  details.amountLocked.gt(ZERO);

// Shows in green the amount of yield not yet assigned to the lock account
const UnrealizedYield: FC<{ value: BN | null }> = ({ value }) =>
  value ? (
    <>
      <span className="text-green-bright">
        +{toFixedWithPrecision(toSol(value))}
      </span>
      <TooltipPopover>{tooltips.unrealizedYield}</TooltipPopover>
    </>
  ) : (
    <></>
  );

export const LockDetailsView: FC<Props> = ({ lockDetails }) => {
  const lockText = hasLockedBalance(lockDetails)
    ? "Your Impact NFT is proof of your stake. It grows as your stake matures. Return regularly to upgrade your NFT to the next level."
    : "Your Impact NFT is proof of your stake. It grows as your stake matures. Re-lock your gSOL to grow it to the next level.";

  const additionalYieldRequired =
    getAdditionalYieldRequiredToNextLevel(lockDetails);
  const additionalYieldRequiredMinZero = additionalYieldRequired.gte(ZERO)
    ? additionalYieldRequired
    : ZERO;

  return (
    <>
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">
          Impact NFT level {lockDetails.currentLevel?.index}
        </div>
        <p className="text-gray-700 text-base">{lockText}</p>
      </div>
      <div className="px-6 pt-4 pb-2">
        <LockDetailTag>
          Locked -{" "}
          {toFixedWithPrecision(toSol(lockDetails.amountLocked ?? ZERO))} gSOL{" "}
          <TooltipPopover>{tooltips.lockCarbon}</TooltipPopover>
        </LockDetailTag>
        <LockDetailTag>
          Yield accrued -{" "}
          {toFixedWithPrecision(toSol(lockDetails.yield ?? ZERO), 3)} gSOL
          <TooltipPopover>{tooltips.lockYield}</TooltipPopover>
          <UnrealizedYield
            value={lockDetails.unrealizedYield}
          ></UnrealizedYield>
        </LockDetailTag>
        <LockDetailTag>
          Equivalent carbon price -{" "}
          {toFixedWithPrecision(
            solToCarbon(toSol(lockDetails.yield ?? ZERO)),
            3
          )}{" "}
          tCO₂E
          <TooltipPopover>{tooltips.lockCarbon}</TooltipPopover>
        </LockDetailTag>
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          Next level in - {toSol(additionalYieldRequiredMinZero)} gSOL
        </span>
      </div>
    </>
  );
};
