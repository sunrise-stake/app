import React, { useState, useEffect } from "react";
import clx from "classnames";
import { Button } from "./Button";
import {
  LockClosedIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { solToCarbon, toFixedWithPrecision, toSol } from "../utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Spinner from "./Spinner";
import type BN from "bn.js";
import { type EpochInfo } from "@solana/web3.js";
import { type EpochReportAccount } from "@sunrisestake/client";

dayjs.extend(relativeTime);

interface LockedGSolProps {
  lockDetails: { amountLocked: BN; yield: BN; updatedToEpoch: BN };
  currentEpoch: EpochInfo;
  epochReport: EpochReportAccount;
  update: () => Promise<any>;
  unlock: () => Promise<any>;
}

const LockedGSol: React.FC<LockedGSolProps> = ({
  lockDetails,
  currentEpoch,
  epochReport,
  update,
  unlock,
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [needsUpdate] = useState(
    () => lockDetails.updatedToEpoch.toNumber() < currentEpoch.epoch
  );

  useEffect(() => {
    if (isClicked) {
      const timeout = setTimeout(() => {
        setIsClicked(false);
      }, 5000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isClicked]);

  return (
    <div className="flex flex-row sm:justify-center sm:items-center">
      <Button
        variant="primary"
        className="relative z-10 h-16 min-w-[10rem] sm:min-w-[12rem] items-center"
      >
        <div className="flex flex-row items-center">
          {!isBusy ? (
            <LockClosedIcon
              width={44}
              className="sm:ml-0 sm:mr-4 px-2 rounded"
              onClick={() => {
                setIsBusy(true);
                unlock().finally(() => {
                  setIsBusy(false);
                });
              }}
            />
          ) : (
            <Spinner className="sm:ml-0 sm:mr-5 px-2 rounded" />
          )}
          <div className="text-lg ml-2 -mr-2 sm:mr-0 ">
            <span className="font-bold text-sm sm:text-lg">
              {"Locked "}
              {toFixedWithPrecision(toSol(lockDetails.amountLocked))}
            </span>{" "}
            <span className="font-bold text-sm sm:text-lg">
              {"Offset "}
              {toFixedWithPrecision(solToCarbon(toSol(lockDetails.yield)), 3)}
            </span>{" "}
            <span className="text-xs font-bold">tCO₂E</span>
            {needsUpdate ? (
              <ArrowPathIcon
                width={44}
                className="sm:ml-0 sm:mr-4 px-2 rounded"
                onClick={(e) => {
                  e.preventDefault();
                  setIsBusy(true);
                  update().finally(() => {
                    setIsBusy(false);
                  });
                }}
              />
            ) : (
              <CheckIcon width={44} className="sm:ml-0 sm:mr-5 px-2 rounded" />
            )}
          </div>
        </div>
      </Button>

      <Button
        onClick={() => {
          setIsClicked(false);
        }}
        variant="secondary"
        className={clx(
          "text-danger border border-danger text-sm absolute items-center rounded-md transition-transform duration-500 z-0 h-16 max-w-[10rem] sm:max-w-[12rem]",
          {
            "transform translate-x-[11rem] sm:translate-x-[14rem]": isClicked,
            "transform translate-x-0": !isClicked,
          }
        )}
      ></Button>
    </div>
  );
};

export default LockedGSol;
