import { FC } from "react";
import Spinner from "../components/Spinner";
import CarbonRecovered from "../components/CarbonRecovered";
import { useSunriseStake } from "../context/sunriseStakeContext";

// TODO remove duplication with StakeDashboard

export const WelcomePage: FC = () => {
  const { client } = useSunriseStake();

  return (
    <div className="w-full">
      {!client && <Spinner />}
      <img
        className="h-25 w-auto m-auto py-2"
        src={"./logo.png"}
        alt="Sunrise"
      />
      <CarbonRecovered />
    </div>
  );
};
