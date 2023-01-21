import { Switch } from "@headlessui/react";
import React, { useState } from "react";
import useScript from "../hooks/useScript";
import clx from "classnames";

const TweetButton: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  useScript("https://platform.twitter.com/widgets.js");
  return (
    <div className="flex flex-row justify-between">
      <div className="flex flex-row items-center">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={clx(
            {
              "bg-outset": !enabled,
              "bg-green": enabled,
            },
            " relative inline-flex h-6 w-12 items-center rounded-full"
          )}
        >
          <span className="sr-only">Enable notifications</span>
          <span
            className={clx(
              {
                "translate-x-7": enabled,
                "translate-x-1": !enabled,
              },
              "inline-block h-4 w-4 transform rounded-full bg-white transition"
            )}
          />
        </Switch>
        <div className="text-xs ml-2">Disclose Amount</div>
      </div>
      <a
        href="https://twitter.com/share?ref_src=twsrc%5Etfw"
        className="twitter-share-button"
        data-size="large"
        data-text="I just staked with Sunrise, offsetting carbon and making Solana stronger."
        data-url="https://www.sunrisestake.com/"
        data-via="sunrisestake"
        data-hashtags="solana"
        data-related="sunrisestake"
        data-show-count="false"
      >
        Tweet
      </a>
    </div>
  );
};

export default TweetButton;
