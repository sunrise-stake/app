import { useState, type FC } from "react";
import { useCopyToClipboard } from "usehooks-ts";

import { Card } from "../common/container/Card";
import { QRCodeCard } from "./QRCodeCard";
import { ReferTweetButton } from "./ReferTweetButton";

export const ReferralOptions: FC<{ link: string }> = ({ link }) => {
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  const copyLink = (): void => {
    if (link === null) return;
    copy(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 5000);
      })
      .catch(console.error);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <button onClick={copyLink}>
        <Card
          title={copied ? "✓ Copied" : "Copy to Clipboard"}
          size="medium"
          image={
            <img
              src="/clip.png"
              className="w-full h-full object-contain"
              alt="Copy"
            />
          }
        ></Card>
      </button>
      <Card
        size="medium"
        title={"Share"}
        image={
          <ReferTweetButton link={link}>
            <img src="/sowing.png" alt="Share link" />
          </ReferTweetButton>
        }
      ></Card>
      <QRCodeCard link={link} type="sunrise" />
      <QRCodeCard link={link} type="solanapay" />
    </div>
  );
};
