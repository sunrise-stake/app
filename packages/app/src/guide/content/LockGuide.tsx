import { type FC } from "react";
import { BaseGuide } from "../components/BaseGuide";
import { type GuideEntryProps } from "../components/GuideEntry";

const entries: GuideEntryProps[] = [
  {
    image: "guide/lock/1.png",
    children: (
      <div className="py-8">
        Here you can lock your gSOL into a non-custodial locking contract in
        order to earn an Impact NFT.
      </div>
    ),
  },
  {
    image: "guide/lock/2.png",
    children: (
      <>
        An Impact NFT represents the amount of carbon offset by Sunrise Stake
        that can be attributed to your stake.
      </>
    ),
  },
  {
    image: "guide/lock/3.png",
    children: (
      <div className="py-20">
        Locking gSOL is purely optional. Your stake is offsetting carbon even if
        not locked.
      </div>
    ),
  },
  {
    image: "guide/lock/4.png",
    children: (
      <>
        gSOL must be locked for at least one full Solana epoch (2-3 days). This
        is counted from the start of the next epoch. So if you lock one day
        before the end of the epoch, your stake is locked for one epoch plus one
        day.
      </>
    ),
  },
  {
    image: "guide/lock/5.png",
    children: (
      <div className="py-8">
        Locked gSOL will not appear in your wallet. However, it is still fully
        under your control. To unlock after the initial 1 epoch period, just
        visit this page and click Unlock
      </div>
    ),
  },
  {
    image: "guide/lock/6.png",
    children: (
      <>
        Impact NFTs start at level zero. As you leave your stake locked, the NFT
        increases in level, and develops from a sapling into a mature and robust
        tree.
      </>
    ),
  },
  {
    image: "guide/lock/7.png",
    children: (
      <div className="py-12">
        Return to this page after some time and click Upgrade to see if you are
        eligible for the next level.
      </div>
    ),
  },
];

export const LockGuide: FC = () => {
  return <BaseGuide entries={entries} />;
};
