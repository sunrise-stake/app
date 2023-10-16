import React, { type FC, type PropsWithChildren } from "react";

export const ShareButton: FC<PropsWithChildren & { link: string }> = ({
  link,
  children,
}) => {
  const shareData = {
    title: "Sunrise Stake",
    text: "Help me grow my forest on Sunrise Stake!",
    url: link,
  };
  const enabled = window.navigator?.canShare?.(shareData);

  const shareLink = (): void => {
    if (link === null || !enabled) return;
    window.navigator.share(shareData).catch(console.error);
  };

  return (
    <a onClick={shareLink} className="block relative">
      {children}
    </a>
  );
};
