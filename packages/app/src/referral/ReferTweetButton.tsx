import React, { type PropsWithChildren } from "react";
import { Tweet } from "../common/components/Tweet";

const ReferTweetButton: React.FC<{ link: string } & PropsWithChildren> = ({
  link,
  children,
}) => {
  return (
    <div className="max-w-full max-h-full flex flex-col items-center relative">
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mt-2 mb-1 text-center">
        <Tweet
          url={link}
          tweet="Join my forest on Sunrise Stake! Join me and the Solana community in making a collective positive environmental impact."
        />
      </div>
      {children}
    </div>
  );
};

export { ReferTweetButton };
