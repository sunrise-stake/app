import React, { type FC } from "react";
import { QRCodeSVG } from "qrcode.react";
import clx from "classnames";
import { Card } from "../common/container/Card";
import { useWallet } from "@solana/wallet-adapter-react";
import { SolanaPayQRCode } from "./SolanaPayQRCode";

const SunriseQRCode: FC<{ link: string }> = ({ link }) => (
  <QRCodeSVG
    value={link}
    className={clx("w-full h-full")}
    fgColor="#145D3E"
    includeMargin={false}
    imageSettings={{
      src: "/logo-icon.svg",
      x: undefined,
      y: undefined,
      height: 32,
      width: 32,
      excavate: true,
    }}
  />
);

export const QRCodeCard: FC<{
  link: string;
  type: "sunrise" | "solanapay";
}> = ({ link, type }) => {
  const wallet = useWallet();
  const QRCode =
    type === "sunrise" || wallet.publicKey === null ? (
      <SunriseQRCode link={link} />
    ) : (
      <SolanaPayQRCode reference={wallet.publicKey} />
    );

  const title = type === "sunrise" ? "Scan" : "Stake 0.1 SOL";

  return <Card size="medium" title={title} image={QRCode} />;
};
