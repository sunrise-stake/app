import { type FC } from "react";
import { HubGuide } from "./HubGuide";
import { ForestGuide } from "./ForestGuide";
import { GrowGuide } from "./GrowGuide";
import { LockGuide } from "./LockGuide";
import { StakeGuide } from "./StakeGuide";
import { useHelp } from "../common/context/HelpContext";
import { AppRoute } from "../Routes";
import { ConnectGuide } from "./ConnectGuide";

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
