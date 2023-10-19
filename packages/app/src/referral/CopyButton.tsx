import React, { type FC, type PropsWithChildren, useState } from "react";
import { Transition } from "@headlessui/react";
import { useCopyToClipboard } from "usehooks-ts";

export const CopyButton: FC<PropsWithChildren & { link: string }> = ({
  link,
  children,
}) => {
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
    <a onClick={copyLink} className="block relative">
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
        <span className="absolute bottom-0 right-0 inline-flex gap-1 py-1 text-sm font-semibold mt-1 mr-2 mb-1">
          ✓
        </span>
      </Transition>
      {children}
    </a>
  );
};
