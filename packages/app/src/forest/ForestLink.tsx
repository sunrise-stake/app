import { Transition } from "@headlessui/react";
import { FaLink, FaQrcode } from "react-icons/fa";
import { type FC, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

import { QRCodeModal } from "../common/components/modals/QRCodeModal";
import { useModal } from "../common/hooks";
import { useSunriseStore } from "../common/store/useSunriseStore";

export const ForestLink: FC = () => {
  const { publicKey } = useSunriseStore((state) => state.wallet);
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const qrCodeModal = useModal(() => {});

  const link =
    publicKey && `https://app.sunrisestake.com/forest#${publicKey.toBase58()}`;

  return link !== null ? (
    <>
      <FaLink
        size={32}
        className="text-green-light w-4 md:w-12"
        onClick={() => {
          copy(link)
            .then(() => {
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 5000);
            })
            .catch(console.error);
        }}
      />

      <Transition
        className=""
        show={copied}
        unmount={false}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        leave="transition-opacity duration-500"
      >
        <span className="inline-flex gap-1 text-green-light rounded-full py-1 text-sm font-semibold text-gray-700 mt-1 mr-2 mb-4">
          copied ✓
        </span>
        <FaQrcode
          size={32}
          className="text-green-light w-4 md:w-12"
          onClick={() => {
            qrCodeModal.trigger();
          }}
        />
      </Transition>
      <QRCodeModal
        ok={qrCodeModal.onModalOK}
        cancel={qrCodeModal.onModalClose}
        show={qrCodeModal.modalShown}
        url={link}
      />
    </>
  ) : (
    <></>
  );
};
