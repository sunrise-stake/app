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
      <>Click the Stake button to add to your stake and receive gSOL tokens.</>
    ),
  },
  {
    image: "guide/hub/3.png",
    children: (
      <>
        Visit the Grow page to see how you can use your gSOL and add trees to
        your forest.
      </>
    ),
  },
  {
    image: "guide/hub/4.png",
    children: <>Visit the Forest page to watch your community grow.</>,
  },
  {
    image: "guide/hub/5.png",
    children: <>Lock your gSOL to earn an Impact NFT.</>,
  },
];

export const HubGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
