import clx from "classnames";
import { type ForwardRefRenderFunction, forwardRef, useEffect } from "react";

import { useZenMode } from "../common/context/ZenModeContext";
import { AppRoute } from "../Routes";
import { useHelp } from "../common/context/HelpContext";
import { Link } from "react-router-dom";
import { IoChevronBackOutline } from "react-icons/io5";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { toShortBase58 } from "../common/utils";
import { FaWallet } from "react-icons/fa";
import { Button } from "../common/components";
// import { useLocation, useNavigate } from "react-router-dom";
// import { useWallet } from "@solana/wallet-adapter-react";

const _TipjarApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();

  const wallet = useWallet();

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.TipJar) return; // we are not on the stake page, so don't update zen mode
    updateZenMode({
      showBGImage: false,
      showHelpButton: false,
      showExternalLinks: false,
      showWallet: false,
    });
  }, [active]);

  const NFTsData = [
    {
      Avatar: "earth_day/nfts1.png",
      nftTitle: "Drip 1",
      nameOfArtist: "Name of Artist",
      inWallet: true,
    },
    {
      Avatar: "earth_day/nfts2.png",
      nftTitle: "Drip 2",
      nameOfArtist: "Name of Artist",
      inWallet: false,
    },
    {
      Avatar: "earth_day/nfts3.png",
      nftTitle: "Drip 3",
      nameOfArtist: "Name of Artist",
      inWallet: true,
    },
    {
      Avatar: "earth_day/nfts4.png",
      nftTitle: "Drip 4",
      nameOfArtist: "Name of Artist",
      inWallet: false,
    },
    {
      Avatar: "earth_day/nfts5.png",
      nftTitle: "Drip 5",
      nameOfArtist: "Name of Artist",
      inWallet: true,
    },
    {
      Avatar: "earth_day/nfts6.png",
      nftTitle: "Drip 6",
      nameOfArtist: "Name of Artist",
      inWallet: false,
    },
  ];

  const NFTs = NFTsData.map((items, index) => (
    <div
      key={index}
      className="mb-8 relative h-fit w-full border-[1px] rounded-lg border-[#969696]"
    >
      {items.inWallet ? (
        <div className="bg-[#FFD660] px-10 py-2.5 rounded-b-lg absolute top-0 left-1/2 transform -translate-x-1/2">
          <h2 className="color-[#145D3E] text-lg font-semibold whitespace-nowrap ">
            In your wallet
          </h2>
        </div>
      ) : null}
      <div className="w-full p-[0.2%] h-[338px]">
        <img
          src={items.Avatar}
          alt={items.nftTitle}
          className="h-full w-full object-center rounded-t-lg"
        />
      </div>
      <div className="w-full p-4">
        <h3 className="text-2xl text-[#000] font-bold">{items.nftTitle}</h3>
        <h4 className="py-2 text-[1rem] text-[#000]">{items.nameOfArtist}</h4>
        <Button className="bg-[#145D3E] w-[auto]">Tip the artist</Button>
      </div>
    </div>
  ));

  return (
    <div
      className={clx("flex flex-col items-center", className)}
      ref={ref}
      {...rest}
    >
      <div className="container mt-5">
        <Link
          to={wallet.connected ? "/grow" : "/"}
          className="flex items-center text-green"
        >
          <div className="flex items-center nowrap">
            <IoChevronBackOutline className="inline" size={48} />
          </div>
        </Link>
        <div className="flex flex-row justify-between">
          <h2 className="my-4 text-center text-3xl">
            <img src="logo.png" width="40" className="inline mr-4" />
            <span className="text-green">Sunrise Stake</span> x{" "}
            <span className="text-[#8559D5]">DRiP</span>
          </h2>
          <div className="my-2">
            <WalletMultiButton className="!bg-[#145D3E] !text-white !text-sm">
              {wallet.publicKey ? (
                <>
                  <FaWallet className="mr-2" />
                  {toShortBase58(wallet.publicKey)}
                </>
              ) : (
                "Connect wallet"
              )}
            </WalletMultiButton>
          </div>
        </div>
      </div>

      <div
        className="w-full p-8 bg-cover text-white"
        style={{ backgroundImage: "url('earth_day/hero_background.png')" }}
      >
        <div className="flex flex-col items-center lg:flex-row">
          <div className="basis-1/2  flex flex-col justify-center lg:justify-start">
            <h3 className="mb-6 text-5xl font-bold text-white lg:mx-8">
              Earth Day on Solana
            </h3>
            <div className="lg:mb-6 mb-6 text-lg lg:mx-8">
              <p>
                For Earth Day 2023, Sunrise is partnering with DRiP to raise
                awareness about climate action, tell new stories about the
                Solana Foundation&apos;s sustainability achievements & share
                artwork to thousands of wallets registered on the Solana
                blockchain.
              </p>
            </div>
            <div className="flex flex-col lg:flex-row">
              <Button color="ticket" className="lg:mx-8 lg:mb-0 mb-5 font-bold">
                Tip the artists
              </Button>
              <Button
                variant="outline"
                className="border-white text-white font-bold"
              >
                <a href="https://drip.haus/">Visit Drip&apos;s webpage</a>
              </Button>
            </div>
          </div>
          <div className="basis-1/2">
            <img src="earth_day/hero_picture.png" className="m-auto py-8" />
          </div>
        </div>
      </div>

      {/* NFTs */}
      <div className="w-full p-3 py-12 lg:p-16">
        <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
          {NFTs}
        </div>
      </div>

      <div
        className="w-full min-h-[80vh] px-16 py-8  bg-no-repeat bg-bottom bg-contain"
        style={{ backgroundImage: "url('earth_day/Leaves.png')" }}
      >
        <div className="flex justify-center">
          <div className="flex flex-col items-center justify-center">
            <img
              src="earth_day/tipjar.png"
              className="w-[93px] h-[93px] mb-8 cursor-pointer"
              alt="TipJar"
            />
            <h5 className="text-[145D3E] text-center text-2xl font-normal cursor-pointer">
              Contribute to the <span className="font-semibold">Tip Jar</span>
              for the artists
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

const TipjarApp = forwardRef(_TipjarApp);

export { TipjarApp };
