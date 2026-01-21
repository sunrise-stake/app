import { encodeURL, type TransactionRequestURLFields } from "@solana/pay";
import { LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import React, { type FC } from "react";
import { type Environment } from "@sunrisestake/client";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import clx from "classnames";
import { QRCodeSVG } from "qrcode.react";

interface SolanaPayQRCodeProps {
  reference: PublicKey;
  amount?: number;
}

const FIXED_AMOUNT = 0.1 * LAMPORTS_PER_SOL;

const network =
  (import.meta.env.REACT_APP_SOLANA_NETWORK as keyof typeof Environment) ??
  WalletAdapterNetwork.Devnet;

const SOLANA_PAY_API = "https://scan.sunrisestake.com/api/transaction";
const centreImage =
  "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMTQ1RDNFIiBoZWlnaHQ9IjE2IiB2aWV3Qm94PSIwIDAgMTYgMTQiIHdpZHRoPSIxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTUuOTE3NiAxMS4wMzgtMi42NDEzIDIuNzcxM2MtLjA1NzQuMDYwMi0uMTI2OS4xMDgyLS4yMDQxLjE0MXMtLjE2MDQuMDQ5Ny0uMjQ0Ni4wNDk3aC0xMi41MjA5NjZjLS4wNTk3NDQgMC0uMTE4MTg3LS4wMTcxLS4xNjgxNDctLjA0OTEtLjA0OTk1OTYtLjAzMjEtLjA4OTI2MDktLjA3NzctLjExMzA3NDUtLjEzMTMtLjAyMzgxMzcyLS4wNTM2LS4wMzExMDI0OS0uMTEyOS0uMDIwOTcwODEtLjE3MDUuMDEwMTMxNzEtLjA1NzYuMDM3MjQyNTEtLjExMS4wNzgwMDE0MS0uMTUzOGwyLjY0MzI3NjktMi43NzEzYy4wNTcyNi0uMDYuMTI2NTEtLjEwNzkuMjAzNDYtLjE0MDdzLjE1OTk2LS4wNDk4LjI0MzktLjA1aDEyLjUyMDMyYy4wNTk3IDAgLjExODIuMDE3MS4xNjgxLjA0OTIuMDUuMDMyLjA4OTMuMDc3Ni4xMTMxLjEzMTMuMDIzOC4wNTM2LjAzMTEuMTEyOC4wMjEuMTcwNC0uMDEwMi4wNTc2LS4wMzczLjExMTEtLjA3OC4xNTM4em0tMi42NDEzLTUuNTgwNjdjLS4wNTc0LS4wNjAyLS4xMjY5LS4xMDgyLS4yMDQxLS4xNDFzLS4xNjA0LS4wNDk3MS0uMjQ0Ni0uMDQ5NjZoLTEyLjUyMDk2NmMtLjA1OTc0NCAwLS4xMTgxODcuMDE3MDgtLjE2ODE0Ny4wNDkxMy0uMDQ5OTU5Ni4wMzIwNS0uMDg5MjYwOS4wNzc2OC0uMTEzMDc0NS4xMzEyOS0uMDIzODEzNzIuMDUzNi0uMDMxMTAyNDkuMTEyODUtLjAyMDk3MDgxLjE3MDQ1LjAxMDEzMTcxLjA1NzYxLjAzNzI0MjUxLjExMTA2LjA3ODAwMTQxLjE1Mzc5bDIuNjQzMjc2OSAyLjc3MTM0Yy4wNTcyNi4wNjAwNC4xMjY1MS4xMDc5NC4yMDM0Ni4xNDA3My4wNzY5NS4wMzI4LjE1OTk2LjA0OTc5LjI0MzkuMDQ5OTNoMTIuNTIwMzJjLjA1OTcgMCAuMTE4Mi0uMDE3MDcuMTY4MS0uMDQ5MTMuMDUtLjAzMjA1LjA4OTMtLjA3NzY4LjExMzEtLjEzMTI5LjAyMzgtLjA1MzYuMDMxMS0uMTEyODUuMDIxLS4xNzA0NS0uMDEwMi0uMDU3NjEtLjAzNzMtLjExMTA2LS4wNzgtLjE1Mzc5em0tMTIuOTY5NjY2LTEuOTkwNjZoMTIuNTIwOTY2Yy4wODQyLjAwMDA0LjE2NzQtLjAxNjg3LjI0NDYtLjA0OTY3cy4xNDY3LS4wODA4LjIwNDEtLjE0MWwyLjY0MTMtMi43NzEzMzNjLjA0MDctLjA0MjczNi4wNjc4LS4wOTYxODkuMDc4LS4xNTM3OTIuMDEwMS0uMDU3NjAzLjAwMjgtLjExNjg0Ny0uMDIxLS4xNzA0NTNzLS4wNjMxLS4wOTkyMzg1LS4xMTMxLS4xMzEyOTExYy0uMDQ5OS0uMDMyMDUyNi0uMTA4NC0uMDQ5MTI4OTMtLjE2ODEtLjA0OTEzMDloLTEyLjUyMDMyYy0uMDgzOTQuMDAwMTM5NzUtLjE2Njk1LjAxNzEzMzktLjI0MzkuMDQ5OTMwNHMtLjE0NjIuMDgwNjk3Ni0uMjAzNDYuMTQwNzM2NmwtMi42NDI1OTU1IDIuNzcxMzMzYy0uMDQwNzE5Ni4wNDI2OS0uMDY3ODE4NC4wOTYwOS0uMDc3OTczMDYuMTUzNjMtLjAxMDE1NDY3LjA1NzU0LS4wMDI5MjM3My4xMTY3My4wMjA4MDYwNi4xNzAzMS4wMjM3Mjk3LjA1MzU4LjA2MjkyNjYuMDk5MjIuMTEyNzgzNS4xMzEzMi4wNDk4NTcuMDMyMTEuMTA4MjA3LjA0OTI4LjE2Nzg5My4wNDk0MXoiLz48L3N2Zz4=";

export const SolanaPayQRCode: FC<SolanaPayQRCodeProps> = ({
  reference,
  amount = FIXED_AMOUNT,
}) => {
  const apiUrl = `${SOLANA_PAY_API}?network=${network}&reference=${reference.toBase58()}&amount=${amount}`;
  const urlParams: TransactionRequestURLFields = {
    link: new URL(apiUrl),
    label: "Sunrise Stake",
  };
  const solanaUrl = encodeURL(urlParams);

  return (
    <QRCodeSVG
      value={solanaUrl.toString()}
      className={clx("w-full h-full")}
      fgColor="#145D3E"
      includeMargin={false}
      imageSettings={{
        src: centreImage,
        x: undefined,
        y: undefined,
        height: 32,
        width: 32,
        excavate: true,
      }}
    />
  );
};
