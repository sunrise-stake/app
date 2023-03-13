import { type FC } from "react";
import { BaseGuide } from "./BaseGuide";
import { type GuideEntryProps } from "./GuideEntry";

const entries: GuideEntryProps[] = [
  {
    image: "guide/grow/1.png",
    children: (
      <>
        This page shows a number of places where you can use your gSOL. Using
        gSOL instead of SOL keeps it staked, even when it leaves your wallet.
      </>
    ),
  },
  {
    image: "guide/grow/2.png",
    children: (
      <>
        The longer your SOL remains staked, the more positive climate impact it
        has.
      </>
    ),
  },
  {
    image: "guide/grow/3.png",
    children: (
      <>
        You can donate your gSOL to charities and organisations, or use it with
        our partner dApps.
      </>
    ),
  },
  {
    image: "guide/grow/4.png",
    children: (
      <>
        By sending or spending gSOL, you join a community of gSOL users; you
        join their `forest`, and they join yours. Visit the `forest` page to see
        your forest develop.
      </>
    ),
  },
  {
    image: "guide/grow/5.png",
    children: (
      <>
        You can also gift gSOL to friends and family, to add them to your
        forest.
      </>
    ),
  },
  {
    image: "guide/grow/6.png",
    children: (
      <>
        Are you building a dApp on Solana? Integrate gSOL to be added to the
        list of partners - just click on &quot;Your App Here&quot; to contact
        us.
      </>
    ),
  },
  {
    image: "guide/grow/7.png",
    children: (
      <>
        Are you a charity or non-profit? Contact us to receive donations in
        gSOL.
      </>
    ),
  },
];

export const GrowGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
