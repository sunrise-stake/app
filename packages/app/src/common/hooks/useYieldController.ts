import { useSunriseStake } from "../context/sunriseStakeContext";
import { useEffect, useState } from "react";
import {
  type YieldControllerState,
  YieldControllerClient,
} from "@sunrisestake/yield-controller";

export const useYieldController = (): YieldControllerState | undefined => {
  const { client } = useSunriseStake();
  const [yieldState, setYieldState] = useState<YieldControllerState>();
  useEffect(() => {
    void (async () => {
      if (!client) return;
      const yieldControllerClient = await YieldControllerClient.get(
        client.internal().provider,
        client.yieldControllerState
      );
      yieldControllerClient.getState().then(setYieldState).catch(console.error);
    })();
  }, [client?.yieldControllerState]);

  return yieldState;
};
