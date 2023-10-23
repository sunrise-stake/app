import { useState, type FC } from "react";
import { useCopyToClipboard } from "usehooks-ts";

import { Card } from "../common/container/Card";
import { QRCodeCard } from "./QRCodeCard";
import { FaTwitter } from "react-icons/fa";

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
      <a
        href={`https://twitter.com/share?text=Join my forest on @SunriseStake!%0A%0AJoin me and the Solana community in making a collective positive environmental impact:%0A${link}`}
        target="_blank"
        rel="noreferrer"
        referrerPolicy="origin"
      >
        <Card
          size="medium"
          title={
            <>
              <FaTwitter size={20} title="Twitter" />
              Share
            </>
          }
          image={
            <img
              src="/sowing.png"
              className="w-full h-full object-contain"
              alt="Copy"
            />
          }
        />
      </a>
      <QRCodeCard link={link} type="sunrise" />
      <QRCodeCard link={link} type="solanapay" />
    </div>
  );
};
