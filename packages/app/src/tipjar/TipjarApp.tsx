import clx from "classnames";
import { type ForwardRefRenderFunction, forwardRef, useEffect } from "react";

import { useZenMode } from "../common/context/ZenModeContext";
import { AppRoute } from "../Routes";
import { useHelp } from "../common/context/HelpContext";
import { Link } from "react-router-dom";
import { IoChevronBackOutline } from "react-icons/io5";
// import { useLocation, useNavigate } from "react-router-dom";
// import { useWallet } from "@solana/wallet-adapter-react";

const _TipjarApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();

  // const location = useLocation();
  // const navigate = useNavigate();
  // const wallet = useWallet();
  // useEffect(() => {
  //   if (!wallet.connected && location.state?.address === undefined)
  //     navigate("/");
  // }, [wallet.connected]);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.TipJar) return; // we are not on the stake page, so don't update zen mode
    updateZenMode({
      showBGImage: false,
      showHelpButton: true,
      showExternalLinks: false,
      showWallet: active,
    });
  }, [active]);

  return (
    <div
      className={clx("flex flex-col items-center", className)}
      ref={ref}
      {...rest}
    >
      <div className="container">
        <Link to="/grow" className="flex items-center text-green">
          <div className="flex items-center nowrap">
            <IoChevronBackOutline className="inline" size={48} />
          </div>
        </Link>
        <h1>Drip x Sunrise</h1>
      </div>
    </div>
  );
};

const TipjarApp = forwardRef(_TipjarApp);

export { TipjarApp };
