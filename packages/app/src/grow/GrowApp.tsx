import { useWallet } from "@solana/wallet-adapter-react";
import { forwardRef, useEffect, type ForwardRefRenderFunction } from "react";
import clx from "classnames";
import { useNavigate } from "react-router-dom";

import { PartnerApp } from "./components/PartnerApp";
import { SendGSolForm } from "./components/SendGSolForm";
import { useZenMode } from "../common/context/ZenModeContext";

const _GrowApp: ForwardRefRenderFunction<
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
      showBGImage: active,
      showWallet: active,
    });
  }, [active]);

  return (
    <div
      className={clx(
        "flex flex-col justify-start items-start sm:justify-center sm:items-center p-8",
        className
      )}
      ref={ref}
      {...rest}
    >
      <h2 className="font-bold text-xl">Partners</h2>
      <div className="flex">
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Your App here</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Your App here</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Your App here</div>
        </PartnerApp>
      </div>
      <h2 className="font-bold text-xl mt-8">Gift a tree</h2>
      <SendGSolForm />
      <h2 className="font-bold text-xl mt-8">Donate gSOL</h2>
      <div className="flex">
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Charity App</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Charity App</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Charity App</div>
        </PartnerApp>
      </div>
    </div>
  );
};

const GrowApp = forwardRef(_GrowApp);

export { GrowApp };
