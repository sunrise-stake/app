import React, { type FC } from "react";

export const ReferralLink: FC<{ link: string }> = ({ link }) => (
  <div className="hidden md:flex flex-row text-lg w-full items-baseline">
    <div className="mr-2 font-bold basis-1/4">Your Referral Link:</div>
    <a className="text-sm text-ellipsis overflow-hidden" href={link}>
      {link}
    </a>
  </div>
);
