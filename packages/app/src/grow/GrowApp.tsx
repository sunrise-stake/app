import { forwardRef, type ForwardRefRenderFunction } from "react";
import clx from "classnames";
import { SendGSolForm } from "./components/SendGSolForm";
import { InfoBox } from "../common/components";
import { toast } from "react-hot-toast";
import { AiOutlineArrowRight } from "react-icons/ai";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { toSol, type Details } from "@sunrisestake/client";
import BN from "bn.js";
import { ZERO } from "../common/utils";

const _GrowApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  const {
    details,
  }: {
    details: Details | undefined;
  } = useSunriseStake();

  // These will be fetch from some data base
  const charityApps = Array.from({ length: 10 }, (x, i) => i);
  const partnerApps = Array.from({ length: 10 }, (x, i) => i);
  return (
    <div
      className={clx(
        "flex flex-col justify-start items-start sm:justify-center sm:items-center p-8 ",
        className
      )}
      ref={ref}
      {...rest}
    >
      <h1 className="font-bold text-3xl text-green mb-16">Grow your forest</h1>
      <h2 className="flex font-bold text-xl items-center gap-4 mb-8">
        Partners{" "}
        <AiOutlineArrowRight
          onClick={() => {
            toast("Will show a page with all partners");
          }}
        />
      </h2>
      <div className="flex overflow-scroll gap-4 pb-8 items-stretch w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl">
        <div
          className="hover:cursor-pointer"
          onClick={() => {
            toast("Will open a form");
          }}
        >
          <InfoBox className="p-8 rounded-md w-40 h-30">
            <div className="text-green text-xl font-medium text-center">
              Your App here
            </div>
          </InfoBox>
        </div>
        {partnerApps.map((app) => {
          return (
            <div
              className="hover:cursor-pointer"
              key={app}
              onClick={() => {
                toast("Coming soon!", { position: "top-center" });
              }}
            >
              <InfoBox className="p-8 rounded-md w-40 h-30">
                <div className="text-green text-xl font-medium text-center">
                  Partner App
                </div>
              </InfoBox>
            </div>
          );
        })}
      </div>
      <h2 className="font-bold text-xl mt-8 mb-4">Gift a tree</h2>
      <SendGSolForm className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl" />
      <div className="flex gap-2 w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl mt-4">
        Balance:{" "}
        <div className="text-green font-bold">
          {toSol(new BN(details?.balances.gsolBalance.amount ?? ZERO))} gSOL
        </div>
      </div>
      <h2 className="flex font-bold text-xl items-center gap-4 mt-16 mb-8">
        Donate gSOL{" "}
        <AiOutlineArrowRight
          onClick={() => {
            toast("Will show a page with all partners");
          }}
        />
      </h2>

      <div className="flex overflow-scroll gap-4 pb-8  w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl">
        {charityApps.map((app) => {
          return (
            <div
              className="hover:cursor-pointer"
              key={app}
              onClick={() => {
                toast("Coming soon!", { position: "bottom-center" });
              }}
            >
              <InfoBox className="p-8 rounded-md w-40 h-30">
                <div className="text-green text-xl font-medium text-center">
                  Charity App
                </div>
              </InfoBox>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GrowApp = forwardRef(_GrowApp);

export { GrowApp };
