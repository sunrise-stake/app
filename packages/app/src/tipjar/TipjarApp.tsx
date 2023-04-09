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
        <h2 className="my-4 text-center text-3xl">
          <span className="text-green">Sunrise Stake</span> x{" "}
          <span className="text-[#8559D5]">DRiP</span>
        </h2>
      </div>
      <div className="w-full p-8 bg-green text-white">
        <h3 className="mb-2 text-3xl text-ticket">Earth Day</h3>
        <div className="mb-4 text-lg">
          <p>DRiP sends you wonderful and free NFTs every week.</p>
          <p>
            For Earth Day, Sunrise Stake and DRiP want to give you the chance to
            appreciate the artists work and offset carbon by doing so.
            <br />
            Send some green SOL as a thank you to the artist of your DRiP drop.
          </p>
        </div>
        <div className="my-2">
          <WalletMultiButton className="!bg-ticket !text-[#145D3E] !text-sm">
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
  );
};

const TipjarApp = forwardRef(_TipjarApp);

export { TipjarApp };
