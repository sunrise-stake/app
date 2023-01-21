import React from "react";
import useScript from "../hooks/useScript";

const TweetButton: React.FC = () => {
  useScript("https://platform.twitter.com/widgets.js");
  return (
    <a
      href="https://twitter.com/share?ref_src=twsrc%5Etfw"
      className="twitter-share-button"
      data-text="I just staked with Sunrise, offsetting carbon and making Solana stronger."
      data-url="https://www.sunrisestake.com/"
      data-via="sunrisestake"
      data-hashtags="solana"
      data-related="sunrisestake"
      data-show-count="false"
    >
      Tweet
    </a>
  );
};

export default TweetButton;
