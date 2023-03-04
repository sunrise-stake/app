import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import {
  useEffect,
  useState,
  type ForwardRefRenderFunction,
  forwardRef,
} from "react";
import { Link } from "react-router-dom";
import { Button, Spinner } from "../common/components";
import { useZenMode } from "../common/context/ZenModeContext";
import { HubIntro } from "./components/HubIntro";
import { NavArrow } from "./components/NavArrow";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useTrees } from "../forest/hooks/useTrees";
import { useCarbon } from "../common/hooks";

const _HubApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  const wallet = useWallet();

  const [showIntro, updateShowIntro] = useState(false);
  const [introLeft, updateIntroLeft] = useState(false);
  const [showHub, updateShowHub] = useState(false);
  const [showHubNav, updateShowHubNav] = useState(false);
  const [, updateShowBGImage] = useZenMode();
  const [stakeButtonMessage, updateStakeButtonMessage] = useState("My Stake");

  const { myTree } = useTrees();
  const { totalCarbon } = useCarbon();

  useEffect(() => {
    if (!wallet.connected && totalCarbon !== undefined) updateShowIntro(true);
    else if (wallet.connected) updateIntroLeft(true);
  }, [totalCarbon]);

  useEffect(() => {
    updateShowIntro(!wallet.connected);
  }, [wallet.connected]);

  useEffect(() => {
    if (introLeft && myTree) {
      updateShowHub(true);
      updateShowBGImage({ showBGImage: false, showWallet: false });
    }
  }, [myTree, introLeft]);

  useEffect(() => {
    if (myTree?.metadata.type.translucent === true)
      updateStakeButtonMessage("Stake to restore your tree");
    else if (myTree?.metadata.type.level === 0)
      updateStakeButtonMessage("Stake to grow your tree");
  }, [myTree]);

  return (
    <div
      className={clx(
        "flex flex-col items-center justify-center text-center",
        className
      )}
      ref={ref}
      {...rest}
    >
      <Spinner
        className={
          (introLeft && !showHub) || totalCarbon === undefined
            ? "block"
            : "hidden"
        }
      />
      <HubIntro
        show={showIntro}
        onLeft={() => {
          updateIntroLeft(true);
        }}
      />
      <div className={introLeft && wallet?.connected ? "block" : "hidden"}>
        <div className="flex">
          <Link
            to="/forest"
            className={clx(
              "flex flex-col justify-center transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <NavArrow direction="left" className="mx-auto" />
            Forest
          </Link>
          {myTree && (
            <DynamicTree
              details={myTree}
              className={`FloatingTree mb-8${
                myTree.metadata.type.translucent ? " saturate-0 opacity-50" : ""
              }`}
              onClick={() => {
                updateShowHubNav(true);
              }}
            />
          )}
          <Link
            to="/grow"
            className={clx(
              "flex flex-col justify-center transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <NavArrow direction="right" className="mx-auto" />
            Grow
          </Link>
        </div>
        <div
          className={clx(
            "w-full text-center transition-opacity ease-in duration-500",
            showHubNav ? "opacity-100" : "opacity-0"
          )}
        >
          <Link to="/stake">
            <Button>{stakeButtonMessage}</Button>
          </Link>
          <Link to="/lock" className="block w-full mt-2">
            <NavArrow direction="down" className="mx-auto" />
            Lock
          </Link>
        </div>
      </div>
    </div>
  );
};

const HubApp = forwardRef(_HubApp);

export { HubApp };
