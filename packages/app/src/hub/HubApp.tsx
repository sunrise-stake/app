import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, type FC } from "react";
import { HubIntro } from "./components/HubIntro";

const HubApp: FC = () => {
  const wallet = useWallet();
  const [showIntro, updateShowIntro] = useState(false);

  useEffect(() => {
    updateShowIntro(true);
  }, []);

  useEffect(() => {
    if (wallet.connected) updateShowIntro(false);
  }, [wallet.connected]);

  return (
    <div className="flex flex-col items-center justify-center container text-center">
      <HubIntro show={showIntro} />
    </div>
  );
};

export { HubApp };
