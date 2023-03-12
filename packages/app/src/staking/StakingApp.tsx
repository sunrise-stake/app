import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import { type ForwardRefRenderFunction, forwardRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useZenMode } from "../common/context/ZenModeContext";
import { StakeDashboard } from "./pages/StakeDashboard";

const _StakingApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [, updateZenMode] = useZenMode();

  useEffect(() => {
    if (!wallet.connected) navigate("/");
  }, [wallet.connected]);

  useEffect(() => {
    updateZenMode({
      showBGImage: false,
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
