import React, { type FC } from "react";
import { ShareButton } from "./ShareButton";
import { FaShareSquare } from "react-icons/fa";
import { Tweet } from "../common/components/Tweet";
import { CopyButton } from "./CopyButton";
import { Card } from "../common/container/Card";
import { ReferTweetButton } from "./ReferTweetButton";
import { QRCodeCard } from "./QRCodeCard";
import { useScreenOrientation } from "../hub/hooks/useScreenOrientation";

export const ReferralOptions: FC<{ link: string }> = ({ link }) => {
  const { screenType } = useScreenOrientation();
  const isPortrait = screenType === "mobilePortrait";
  const shareSupported = window.navigator?.canShare?.();

  return (
    <div className="w-full h-full md:space-x-8 space-y-4 md:space-y-0 justify-around items-center flex flex-col-reverse md:flex-row">
      {isPortrait && (
        <div className="flex flex-row justify-around w-full mt-5 items-center">
          {shareSupported && (
            <ShareButton link={link}>
              <FaShareSquare className="text-white w-8 h-8" />
            </ShareButton>
          )}
          <Tweet
            url={link}
            tweet="Join my forest on Sunrise Stake! Join me and the Solana community in making a collective positive environmental impact."
          />
        </div>
      )}
      {!isPortrait && (
        <>
          <CopyButton link={link}>
            <Card
              title={"Copy to Clipboard"}
              size="medium"
              image={
                <img
                  src="/clip.png"
                  className="w-full h-full object-contain"
                  alt="Copy"
                />
              }
            ></Card>
          </CopyButton>
          <Card
            size="medium"
            title={"Share"}
            image={
              <ReferTweetButton link={link}>
                <img src="/sowing.png" alt="Share link" />
              </ReferTweetButton>
            }
          ></Card>
        </>
      )}
      <QRCodeCard link={link} type="sunrise" />
      <QRCodeCard link={link} type="solanapay" />
    </div>
  );
};
