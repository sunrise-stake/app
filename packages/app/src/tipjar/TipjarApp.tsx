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
        <div className="flex flex-row">
          <div className="basis-1/2">
            <h3 className="mb-2 text-5xl text-white p-8">Earth Day</h3>
            <div className="mb-16 text-lg px-8">
              <p>DRiP sends you wonderful and free NFTs every week.</p>
              <p>
                For Earth Day, Sunrise Stake and DRiP want to give you the
                chance to appreciate the artists work and offset carbon by doing
                so.
                <br />
                Send some green SOL as a thank you to the artist of your DRiP
                drop.
              </p>
            </div>
            <Button color="ticket" className="mx-8">
              See available NFTs
            </Button>
            <Button color="ticket" variant="outline">
              <a href="https://drip.haus/">Visit Drip&apos;s webpage</a>
            </Button>
          </div>
          <div className="basis-1/2">
            <img src="earth_day/hero_picture.png" className="m-auto py-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

const TipjarApp = forwardRef(_TipjarApp);

export { TipjarApp };
