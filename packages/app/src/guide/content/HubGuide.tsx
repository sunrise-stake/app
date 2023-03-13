import { type FC } from "react";
import { BaseGuide } from "../components/BaseGuide";
import { type GuideEntryProps } from "../components/GuideEntry";

const entries: GuideEntryProps[] = [
  {
    image: "guide/hub/1.png",
    children: (
      <>This is your tree. As your stake matures, it will grow and develop.</>
    ),
  },
  {
    image: "guide/hub/2.png",
    children: (
      <div className="py-12">
        Click the Stake button to add to your stake and receive gSOL tokens.
      </div>
    ),
  },
  {
    image: "guide/hub/3.png",
    children: (
      <div className="py-8">
        Visit the Grow page to see how you can use your gSOL and add trees to
        your forest.
      </div>
    ),
  },
  {
    image: "guide/hub/4.png",
    children: (
      <div className="py-8">
        Visit the Forest page to watch your community grow.
      </div>
    ),
  },
  {
    image: "guide/hub/5.png",
    children: <div className="py-8">Lock your gSOL to earn an Impact NFT.</div>,
  },
];

export const HubGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
