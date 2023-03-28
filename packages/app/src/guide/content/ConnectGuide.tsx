import { type FC } from "react";
import { BaseGuide } from "../components/BaseGuide";
import { type GuideEntryProps } from "../components/GuideEntry";

const entries: GuideEntryProps[] = [
  {
    image: "guide/connect/1.png",
    children: (
      <div className="py-10">
        Welcome to Sunrise Stake! You are a few clicks away from offsetting
        carbon passively by staking SOL tokens.
      </div>
    ),
  },
  {
    image: "guide/connect/2.png",
    children: (
      <>
        By staking, you will be part of a community of gSOL token holders, all
        contributing to reducing the carbon footprint of the Solana blockchain.
      </>
    ),
  },
  {
    image: "guide/connect/3.png",
    children: (
      <>
        Your stake is represented as a `tree`. And that community is represented
        as a `forest`. By using gSOL, you can add trees to your forest, and
        expand the roots of Regenerative Finance far and wide in the Solana
        ecosystem.
      </>
    ),
  },
  {
    image: "guide/connect/4.png",
    children: <>You can also lock your gSOL in order to earn an Impact NFT.</>,
  },
  {
    image: "guide/connect/5.png",
    children: (
      <div className="py-16">
        Connect your wallet to start the journey of climate regeneration...
      </div>
    ),
  },
];

export const ConnectGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
