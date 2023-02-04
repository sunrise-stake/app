import { type FC } from "react";
import Spinner from "../components/Spinner";
import CarbonRecovered from "../components/CarbonRecovered";
import { useSunriseStake } from "../context/sunriseStakeContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// TODO remove duplication with StakeDashboard

export const WelcomePage: FC = () => {
  const { details } = useSunriseStake();

  return (
    <div className="w-full">
      {!details ? (
        <div className="flex justify-center items-center m-2">
          <Spinner />
        </div>
      ) : (
        <div
          style={{ maxWidth: "864px" }}
          className="mx-auto flex flex-col items-center"
        >
          <div className="text-center">
            <img
              className="block sm:hidden w-auto h-16 mx-auto mb-3"
              src={"./logo.png"}
              alt="Sunrise"
            />
            <h2 className="text-green-bright font-bold text-6xl">
              Sunrise Stake
            </h2>
            <h3 className="mb-16 text-white font-normal text-lg sm:text-3xl">
              Offset emissions while you sleep.
            </h3>
          </div>
          <p className="mb-12 hidden sm:block">
            Invest in the future by using your staking rewards to support
            climate projects.
          </p>
          <div className="hover:brightness-75 mb-12">
            <WalletMultiButton>
              Start&nbsp;
              <span className="hidden sm:block"> reducing CO2 emissions</span>
            </WalletMultiButton>
          </div>
          <img
            className="h-25 w-auto py-2 hidden sm:block"
            src={"./logo.png"}
            alt="Sunrise"
          />
          <CarbonRecovered />
        </div>
      )}
    </div>
  );
};
