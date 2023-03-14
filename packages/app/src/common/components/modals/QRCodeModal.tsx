import React, { type FC } from "react";

import { BaseModal, type ModalProps } from "./";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  url: string;
}
const QRCodeModal: FC<ModalProps & QRCodeModalProps> = ({ url, ...props }) => {
  return (
    <BaseModal {...props} showActions={false}>
      <div className="flex flex-col items-center justify-center w-full h-2/3">
        <QRCodeSVG value={url} fgColor="2e8555" />
      </div>
    </BaseModal>
  );
};

export { QRCodeModal };
