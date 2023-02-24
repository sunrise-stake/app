import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";

import { CarbonRecovered, Spinner } from "../common/components";
import { useSunriseStake } from "../common/context/sunriseStakeContext";

const IntroApp: FC = () => {
  const wallet = useWallet();
  const navigate = useNavigate();
  const { details } = useSunriseStake();

  useEffect(() => {
    if (wallet.connected) navigate("/stake");
  }, [wallet.connected]);

  return (
    <>
      {details == null ? (
        <div className="flex justify-center items-center m-2">
          <Spinner />
        </div>
      ) : (
        <div
          style={{ maxWidth: "864px" }}
          className="flex flex-col items-center justify-center mx-auto"
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
    </>
  );
};

export { IntroApp };
