import clx from "classnames";
import { type ForwardRefRenderFunction, forwardRef, useEffect } from "react";

import { useZenMode } from "../common/context/ZenModeContext";
import { StakeDashboard } from "./pages/StakeDashboard";
import { AppRoute } from "../Routes";
import { useHelp } from "../common/context/HelpContext";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";

const _StakingApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();

  const navigate = useNavigate();
  const wallet = useWallet();
  useEffect(() => {
    if (!wallet.connected && active) navigate("/");
  }, [active, wallet.connected]);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Stake) return; // we are not on the stake page, so don't update zen mode
    updateZenMode((prev) => ({
      ...prev,
      showBGImage: false,
      showHelpButton: true,
      showExternalLinks: true,
      showWallet: active,
    }));
  }, [active, currentHelpRoute]);

  return (
    <div
      className={clx("flex flex-col items-center pb-14", className)}
      ref={ref}
      {...rest}
    >
      <StakeDashboard />
    </div>
  );
};

const StakingApp = forwardRef(_StakingApp);

export { StakingApp };
