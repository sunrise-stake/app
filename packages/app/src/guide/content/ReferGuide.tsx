import { type FC } from "react";
import { BaseGuide } from "../components/BaseGuide";
import { type GuideEntryProps } from "../components/GuideEntry";

const entries: GuideEntryProps[] = [
  {
    image: "guide/refer/1.png",
    children: <>Share your referral link with friends to build your forest!</>,
  },
  {
    image: "guide/refer/2.png",
    children: (
      <div className="py-8">
        The more people stake at least 0.1 gSOL using your link, the more trees
        grow in your forest, and the higher you climb the leaderboard.
      </div>
    ),
  },
];

export const ReferGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
