import { Switch } from "@headlessui/react";
import React, { useState } from "react";
import useScript from "../hooks/useScript";
import clx from "classnames";
import { XMarkIcon } from "@heroicons/react/24/solid";
import toast, { Toast } from "react-hot-toast";

interface TweetButtonProps {
  amount: string;
  t: Toast;
}

const TweetButton: React.FC<TweetButtonProps> = ({ amount, t }) => {
  const [enabled, setEnabled] = useState(false);
  const [tweet, setTweet] = useState(
    '"I just staked with Sunrise, offsetting carbon and making Solana stronger"'
  );
  useScript("https://platform.twitter.com/widgets.js");

  return (
    <div className=" bg-background p-8 rounded-md border border-green">
      <div className={`ml-2 flex-shrink-0 flex justify-end`}>
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`default-transition rounded-md inline-flex text-white hover:opacity-75 focus:outline-none`}
        >
          <span className={`sr-only`}>Close</span>

          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(46, 133, 85, 0) 34.82%, rgba(46, 133, 85, 0.11) 100%), #212121",
          maxWidth: "464px",
        }}
        className="px-16 py-8 my-8 rounded-md text-center"
      >
        {tweet}
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center">
          <Switch
            checked={enabled}
            onChange={(e: boolean) => {
              setEnabled(e);
              if (e) {
                setTweet(
                  `"I just staked ${amount} Sol with Sunrise, offsetting carbon and making Solana stronger"`
                );
              } else {
                setTweet(
                  '"I just staked with Sunrise, offsetting carbon and making Solana stronger"'
                );
              }
            }}
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
          data-text={tweet}
          data-url="https://www.sunrisestake.com/"
          data-via="sunrisestake"
          data-hashtags="solana"
          data-related="sunrisestake"
          data-show-count="false"
        >
          Tweet
        </a>
      </div>
    </div>
  );
};

export default TweetButton;
