import { ZERO } from "../common/utils";
import { type Details, type LockDetails } from "@sunrisestake/client";
import type BN from "bn.js";

export const getAdditionalYieldRequiredToNextLevel = (
  lockDetails: LockDetails
): BN => {
  const yieldToNextLevel = lockDetails.yieldToNextLevel ?? ZERO;
  return yieldToNextLevel.sub(lockDetails.unrealizedYield ?? ZERO);
};

export const upgradePossible = (lockDetails: LockDetails): boolean =>
  getAdditionalYieldRequiredToNextLevel(lockDetails).lte(ZERO);

export const detailsIndicateUpgradePossible = (
  details: Details | undefined
): boolean => {
  if (!details?.lockDetails) return false;
  return upgradePossible(details.lockDetails);
};
