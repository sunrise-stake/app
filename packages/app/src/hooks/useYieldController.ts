import { useSunriseStake } from "../context/sunriseStakeContext";
import { useEffect, useState } from "react";
import {
  type YieldControllerState,
  YieldControllerClient,
} from "@sunrisestake/yield-controller";
import { YIELD_CONTROLLER_STATE } from "@sunrisestake/client";

export const useYieldController = (): YieldControllerState | undefined => {
  const { client } = useSunriseStake();
  const [yieldState, setYieldState] = useState<YieldControllerState>();
  useEffect(() => {
    void (async () => {
      if (!client) return;
      const yieldControllerClient = await YieldControllerClient.get(
        client.client.provider,
        YIELD_CONTROLLER_STATE
      );
      yieldControllerClient.getState().then(setYieldState).catch(console.error);
    })();
  }, [YIELD_CONTROLLER_STATE]);

  return yieldState;
};
