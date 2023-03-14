import { useWallet } from "@solana/wallet-adapter-react";
import { FaLink, FaQrcode } from "react-icons/fa";
import { useCopyToClipboard } from "usehooks-ts";
import { type FC, useState } from "react";
import { Transition } from "@headlessui/react";

export const ForestLink: FC = () => {
  const { publicKey } = useWallet();
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

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
              }, 1000);
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
        <div>copied</div>
        <FaQrcode
          size={32}
          className="text-green-light w-4 md:w-12"
          onClick={() => {
            copy(link)
              .then(() => {
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 1000);
              })
              .catch(console.error);
          }}
        />
      </Transition>
    </>
  ) : (
    <></>
  );
};
