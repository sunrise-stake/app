import React from "react";
import { useScript } from "../common/hooks";

const LockTweetButton: React.FC = () => {
  useScript("https://platform.twitter.com/widgets.js");

  return (
    <div className="flex flex-col items-center px-16 pt-8 mt-4 rounded-md max-w-md">
      <div className="text-center mb-4">
        Tweet your NFT to show your impact!
      </div>
      <div className="mt-2 mb-2 text-center">
        <a
          href="https://twitter.com/share?ref_src=twsrc%5Etfw"
          className="twitter-share-button"
          data-size="large"
          data-text="I locked $gSOL with @sunrisestake and earned an impact NFT!&#010;Visit app.sunrisestake.com to stake for climate impact.&#010;"
          data-url="https://api.sunrisestake.com/nfts/"
        />
      </div>
    </div>
  );
};

export { LockTweetButton };
