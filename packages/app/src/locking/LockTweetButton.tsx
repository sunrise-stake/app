import React from "react";
import { Tweet } from "../common/components/Tweet";

const LockTweetButton: React.FC = () => {
  return (
    <div className="flex flex-col items-center px-16 pt-8 mt-4 rounded-md max-w-md">
      <div className="text-center mb-4">
        Tweet your NFT to show your impact!
      </div>
      <div className="mt-2 mb-2 text-center">
        <Tweet
          tweet="I locked $gSOL with @sunrisestake and earned an impact NFT!&#010;Visit app.sunrisestake.com to stake for climate impact.&#010;"
          url="https://api.sunrisestake.com/nfts/"
        />
      </div>
    </div>
  );
};

export { LockTweetButton };
