import { type FC } from "react";
import { BaseGuide } from "./BaseGuide";
import { type GuideEntryProps } from "./GuideEntry";

const entries: GuideEntryProps[] = [
  {
    image: "guide/stake/1.png",
    children: (
      <>
        Here you manage your stake. You can add to your stake at any time, and
        you can unstake at any time, receiving your original SOL back.
      </>
    ),
  },
  {
    image: "guide/stake/2.png",
    children: (
      <>
        Sunrise Stake is built upon trusted Stake Pool partners such as Marinade
        and SolBlaze. To see what happens to your SOL once you stake, visit the
        docs.
      </>
    ),
  },
];

export const StakeGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
