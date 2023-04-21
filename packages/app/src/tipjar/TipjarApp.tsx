import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import clx from "classnames";
import {
  type ForwardRefRenderFunction,
  forwardRef,
  useEffect,
  useState,
} from "react";
import { IoChevronBackOutline } from "react-icons/io5";
import { FaWallet } from "react-icons/fa";
import { Link } from "react-router-dom";

import { AppRoute } from "../Routes";
import { Button, Logo } from "../common/components";
import { useZenMode } from "../common/context/ZenModeContext";
import { useHelp } from "../common/context/HelpContext";
import { toShortBase58 } from "../common/utils";
import { DonatableArtistNFT } from "./components/DonatableArtistNFT";

function generateTweetMessage(artistHandle: string): string {
  return `I got an awesome NFT to celebrate %23EarthDay with %40sunrisestake %26 %40drip_haus!%0AI just tipped my artist, ${artistHandle}!%0ATip your artist here: https://app.sunrisestake.com/earthday`;
}

const _TipjarApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();
  const [tippedArtist, setTippedArtist] = useState<string | null>(null);

  const wallet = useWallet();

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.TipJar) return;
    updateZenMode({
      showBGImage: active,
      showHelpButton: active,
      showExternalLinks: active,
      showWallet: false,
    });
  }, [active, currentHelpRoute]);

  return (
    <div
      className={clx("flex flex-col items-center scroll-smooth", className)}
      ref={ref}
      {...rest}
    >
      <div className="container">
        <div className="flex sm:hidden justify-between mt-2">
          <Link
            to={wallet.connected ? "/grow" : "/"}
            className="flex sm:hidden items-center text-green"
          >
            <div className="flex align-center items-center text-xl">
              <IoChevronBackOutline className="inline" size={48} />
              Back
            </div>
          </Link>
          <WalletMultiButton className="!bg-green hover:!bg-green-light !text-white">
            {wallet.publicKey ? (
              <>
                <FaWallet className="mr-0 sm:mr-2" />
                <div className="hidden sm:inline text-sm">
                  {toShortBase58(wallet.publicKey)}
                </div>
              </>
            ) : (
              "Connect wallet"
            )}
          </WalletMultiButton>
        </div>
        <div className="flex items-center my-4 leading-none">
          <Link
            to={wallet.connected ? "/grow" : "/"}
            className="hidden sm:flex items-center text-green"
          >
            <div className="flex align-center items-center text-xl">
              <IoChevronBackOutline className="inline" size={48} />
              Back
            </div>
          </Link>
          <div className="flex grow items-center justify-center gap-4">
            <Logo className="h-14" />
            <span className="text-yellow text-3xl font-bold"> x </span>
            <img className="h-9" alt="DRiP" src="/earth_day/drip-logo.svg" />
          </div>
          <div className="hidden sm:block ">
            <WalletMultiButton className="!bg-green hover:!bg-green-light !text-white !px-6 !py-4">
              {wallet.publicKey ? (
                <>
                  <FaWallet className="mr-0 sm:mr-2" />
                  <div className="hidden sm:inline">
                    {toShortBase58(wallet.publicKey)}
                  </div>
                </>
              ) : (
                "Connect wallet"
              )}
            </WalletMultiButton>
          </div>
        </div>
      </div>

      {tippedArtist === null ? (
        <>
          <div
            className="z-10 w-full p-8 bg-cover text-white"
            style={{ backgroundImage: "url('earth_day/hero_background.png')" }}
          >
            <div className="flex flex-col items-center lg:flex-row">
              <div className="basis-1/2 flex flex-col justify-center lg:justify-start">
                <h3 className="mb-6 lg:mx-8 text-5xl font-bold text-white ">
                  Earth Day on Solana
                </h3>
                <div className="mb-6 lg:mx-8 text-lg">
                  <p>
                    For Earth Day 2023, Sunrise is partnering with DRiP to raise
                    awareness about climate action, tell new stories about the
                    Solana Foundation&apos;s sustainability achievements & share
                    artwork to thousands of wallets registered on the Solana
                    blockchain.
                  </p>
                </div>
                <div className="flex flex-col lg:flex-row">
                  <Button
                    color="ticket"
                    className="md:w-1/2 sm:w-1/2 sm:mx-auto lg:mx-8 mb-4 lg:mb-0 flex justify-center font-bold !text-[#145D3E]"
                    onClick={() => {
                      document.getElementById("tipjar-app")?.scrollBy(0, 20000);
                    }}
                  >
                    See available NFTs
                  </Button>
                  <Button
                    variant="outline"
                    className="md:w-1/2 sm:w-1/2 sm:mx-auto flex justify-center border-white hover:border-white text-white hover:text-white font-bold"
                  >
                    <a href="https://drip.haus/">Visit DRiP&apos;s webpage</a>
                  </Button>
                </div>
              </div>
              <div className="basis-1/2 w-full p-8">
                <img
                  src="earth_day/hero_picture.png"
                  className="object-cover mx-auto w-full"
                />
              </div>
            </div>
          </div>
          <div className="w-full p-3 py-12 lg:p-16">
            <DonatableArtistNFT
              query={{
                collection: new PublicKey(
                  "DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6WK3GChEySUpHSS4x"
                ), // DRiP
                jsonFilter: {
                  // attributes: [
                  //   // DRiP data
                  //   // {
                  //   //   trait_type: "drop",
                  //   //   value: "???", // TODO - what is the value for Earth Day?
                  //   // },
                  // ],
                },
              }}
              onDonate={(artist) => {
                setTippedArtist(artist.twitter);
              }}
            />
          </div>
        </>
      ) : (
        <div className="container mb-20">
          <img className="mx-auto mt-4 sm:mt-8" src="earth_day/tipjar.png" />
          <h2 className="mt-4 sm:mt-8 text-3xl font-bold text-center">
            Thanks a lot!
          </h2>
          <p className="mt-4 sm:mt-8 text-lg text-center">
            We appreciate you sharing some love & SOL with our awesome Earth Day
            artists!
            <br />
            Have a Happy Earth Day!
            <a
              href={`https://twitter.com/share?text=${generateTweetMessage(
                tippedArtist
              )}`}
              target="_blank"
              rel="noreferrer"
              className="block mt-8 text-center"
            >
              <Button className="inline">Share on Twitter</Button>
            </a>
            <Link to="/" className="block mt-4 text-center">
              <Button variant="outline" className="inline">
                Go Back Home
              </Button>
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

const TipjarApp = forwardRef(_TipjarApp);

export { TipjarApp };
