import clx from "classnames";
import { type ForwardRefRenderFunction, forwardRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppRoute } from "../Routes";
import { useHelp, useZenMode } from "../common/context";
import { useSunriseStore } from "../common/store/useSunriseStore";
import { StakeDashboard } from "./pages/StakeDashboard";

const _StakingApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();

  const location = useLocation();
  const navigate = useNavigate();
  const wallet = useSunriseStore((state) => state.wallet);
  useEffect(() => {
    if (!wallet.connected && location.state?.address === undefined)
      navigate("/");
  }, [wallet.connected]);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Stake) return; // we are not on the stake page, so don't update zen mode
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
        <StakeDashboard />
      </div>
    </div>
  );
};

const StakingApp = forwardRef(_StakingApp);

export { StakingApp };
