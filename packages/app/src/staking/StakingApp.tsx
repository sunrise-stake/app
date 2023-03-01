import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import React, { useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";

import { StakeDashboard } from "./pages/StakeDashboard";

const StakingApp: FC<
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }) => {
  const wallet = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!wallet.connected) navigate("/");
  }, [wallet.connected]);

  return (
    <div className={clx("flex flex-col items-center", className)} {...rest}>
      <div className="container grow px-8">
        <StakeDashboard />
      </div>
    </div>
  );
};

export { StakingApp };
