import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";

import { StakeDashboard } from "./pages/StakeDashboard";

const StakingApp: FC = () => {
  const wallet = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!wallet.connected) navigate("/");
  }, [wallet.connected]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="container grow mx-auto px-8">
        <StakeDashboard />
      </div>
    </div>
  );
};

export { StakingApp };
