import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import { type ForwardRefRenderFunction, forwardRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { StakeDashboard } from "./pages/StakeDashboard";

const _StakingApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  const wallet = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!wallet.connected) navigate("/");
  }, [wallet.connected]);

  return (
    <div
      className={clx("flex flex-col items-center justify-center", className)}
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
