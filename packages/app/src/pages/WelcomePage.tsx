import { FC } from "react";
import Spinner from "../components/Spinner";
import CarbonRecovered from "../components/CarbonRecovered";
import { useSunriseStake } from "../context/sunriseStakeContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// TODO remove duplication with StakeDashboard

export const WelcomePage: FC = () => {
  const { client } = useSunriseStake();

  return (
    <div className="w-full">
      {!client ? (
        <Spinner />
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
            <h3 className="mb-16 text-white font-normal text-3xl">
              Offset emissions while you sleep.
            </h3>
          </div>
          <p className="mb-12">
            Invest in the future by using your staking rewards to support
            climate projects.
          </p>
          <WalletMultiButton>Start reducing CO2 emissions</WalletMultiButton>
          <img
            className="h-25 w-auto mt-12 py-2"
            src={"./logo.png"}
            alt="Sunrise"
          />

          <CarbonRecovered />
        </div>
      )}
    </div>
  );
};
