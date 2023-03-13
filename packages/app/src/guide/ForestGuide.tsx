import { type FC } from "react";
import { BaseGuide } from "./BaseGuide";
import { type GuideEntryProps } from "./GuideEntry";

const entries: GuideEntryProps[] = [
  {
    image: "guide/forest/1.png",
    children: (
      <>
        Welcome to the forest of regeneration! By staking SOL, you are part of a
        community of gSOL users, contributing to reducing the carbon footprint
        of the Solana blockchain.
      </>
    ),
  },
  {
    image: "guide/forest/2.png",
    children: (
      <>Visit the `grow` page to find out how to add trees to your forest.</>
    ),
  },
  {
    image: "guide/forest/3.png",
    children: (
      <>
        Personalise your tree by fleshing out your profile. Sunrise has teamed
        up with Civic to offer fully decentralised Web3 profiles. Visit civic.me
        to set up your own profile.
      </>
    ),
  },
];

export const ForestGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
