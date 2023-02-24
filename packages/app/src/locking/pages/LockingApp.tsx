import { toSol, type Details } from "@sunrisestake/client";
import { type FC } from "react";
import { Button, Panel } from "../../common/components";
import { useSunriseStake } from "../../common/context/sunriseStakeContext";
import { type SunriseClientWrapper } from "../../common/sunriseClientWrapper";
import { toFixedWithPrecision } from "../../common/utils";

const LockingApp: FC = () => {
  const {
    client,
    details,
  }: {
    client: SunriseClientWrapper | undefined;
    details: Details | undefined;
  } = useSunriseStake();

  return (
    <div className="container mx-auto flex flex-col justify-start items-center">
      {!client && (
        <div className="flex flex-col items-center m-4">
          <h1 className="text-3xl text-center">Loading...</h1>
          <div
            className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full mt-4"
            role="status"
          ></div>
        </div>
      )}
      <div className="w-[20%] h-[20%] bg-green m-8">My Tree</div>
      <div className="w-[20%] h-[20%] bg-green m-8">Impact NFT</div>
      <Panel className="flex flex-row mx-auto mb-9 p-3 sm:p-4 rounded-lg">
        <Button variant="primary" className="mr-4">
          Upgrade
        </Button>
        <Button variant="secondary">Unlock</Button>
      </Panel>
      {details?.lockDetails && (
        <div>
          Locked -{" "}
          {toFixedWithPrecision(toSol(details.lockDetails?.amountLocked))} gSol
        </div>
      )}
      <div className="mt-32">Lock your gSOL for **** to reach level 1</div>
    </div>
  );
};

export { LockingApp };
