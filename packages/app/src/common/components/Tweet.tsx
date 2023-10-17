import React, { type FC } from "react";
import { useScript } from "../hooks";

export const Tweet: FC<{
  tweet: string;
  url?: string;
  size?: "small" | "medium" | "large";
}> = ({ tweet, url, size = "large" }) => {
  useScript("https://platform.x.com/widgets.js");
  return (
    <a
      href="https://twitter.com/share?ref_src=twsrc%5Etfw"
      className="twitter-share-button"
      data-size={size}
      data-text={tweet}
      data-url={url}
      data-related="sunrisestake"
      data-show-count="false"
    >
      Tweet
    </a>
  );
};
