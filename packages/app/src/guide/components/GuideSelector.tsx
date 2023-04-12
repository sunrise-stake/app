import { type FC } from "react";
import { HubGuide } from "../content/HubGuide";
import { ForestGuide } from "../content/ForestGuide";
import { GrowGuide } from "../content/GrowGuide";
import { LockGuide } from "../content/LockGuide";
import { StakeGuide } from "../content/StakeGuide";
import { useHelp } from "../../common/context/HelpContext";
import { AppRoute } from "../../Routes";
import { ConnectGuide } from "../content/ConnectGuide";

export const GuideSelector: FC = () => {
  const { currentHelpRoute } = useHelp();

  if (currentHelpRoute === undefined) return <></>;

  switch (currentHelpRoute) {
    case AppRoute.Hub:
      return <HubGuide />;
    case AppRoute.Forest:
      return <ForestGuide />;
    case AppRoute.Grow:
      return <GrowGuide />;
    case AppRoute.Lock:
      return <LockGuide />;
    case AppRoute.Stake:
      return <StakeGuide />;
    case AppRoute.Connect:
      return <ConnectGuide />;
    default:
      return <></>;
  }
};
