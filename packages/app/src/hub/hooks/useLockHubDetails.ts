import { useMemo } from "react";
import { detailsIndicateUpgradePossible } from "../../locking/utils";
import { useSunriseStake } from "../../common/context/sunriseStakeContext";

export const useLockHubDetails = (): { needsUpgrade: boolean } => {
  const { details } = useSunriseStake();
  const needsUpgrade = useMemo(
    () => detailsIndicateUpgradePossible(details),
    [details]
  );

  return {
    needsUpgrade,
  };
};
