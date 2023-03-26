import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import {
  forwardRef,
  type ForwardRefRenderFunction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  IoChevronBackOutline,
  IoChevronDownOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { Link } from "react-router-dom";
import { Button, Spinner } from "../common/components";
import { useZenMode } from "../common/context/ZenModeContext";
import { HubIntro } from "./components/HubIntro";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useCarbon } from "../common/hooks";
import { useForest } from "../common/context/forestContext";
import { useHelp } from "../common/context/HelpContext";
import { AppRoute } from "../Routes";

const _HubApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const wallet = useWallet();
  const { setCurrentHelpRoute, currentHelpRoute } = useHelp();

  const [showIntro, updateShowIntro] = useState(false);
  const [introLeft, updateIntroLeft] = useState(false);
  const [showHubNav, updateShowHubNav] = useState(false);
  const wasHubNavShown = useRef(false);
  const [zenMode, updateZenMode] = useZenMode();

  const showWalletButton = useMemo(() => {
    return wallet.connected && showHubNav;
  }, [wallet.connected, showHubNav]);

  const { myTree } = useForest();
  const { totalCarbon } = useCarbon();
  const stakeButtonMessage = useMemo(() => {
    if (myTree?.metadata.type.translucent === true) {
      return "Stake to restore your tree";
    } else if (myTree?.metadata.type.level === 0) {
      return "Stake to grow your tree";
    }
    return "My Stake";
  }, [myTree]);

  const showHub = useMemo(() => {
    return wallet.connected && myTree !== undefined;
  }, [wallet.connected, myTree]);

  // Show intro once carbon data are ready, hide once wallet connected
  useEffect(() => {
    if (!wallet.connected && totalCarbon !== undefined) {
      updateShowIntro(true);
      // TODO replace with separating the hub and connect routes
      setCurrentHelpRoute(AppRoute.Connect);
    } else if (wallet.connected) {
      updateShowIntro(false);
      // TODO replace with separating the hub and connect routes
      setCurrentHelpRoute(AppRoute.Hub);
      updateZenMode({
        showHelpButton: false,
        showBGImage: false,
        showExternalLinks: false,
        showWallet: false,
      });
    }
  }, [totalCarbon, wallet.connected]);

  // Once intro is done, and tree data available show hub
  useEffect(() => {
    if (introLeft && myTree) {
      const tid = setTimeout(() => {
        if (!wasHubNavShown.current) updateShowHubNav(true);
      }, 5000);

      return () => {
        clearTimeout(tid);
      };
    }
  }, [myTree, introLeft]);

  useEffect(() => {
    if (showHubNav) wasHubNavShown.current = true;
    updateZenMode({
      ...zenMode,
      showHelpButton: showHubNav,
      showExternalLinks: showHubNav,
      showWallet: showWalletButton,
    });
  }, [showHubNav, showWalletButton]);

  useEffect(() => {
    setTimeout(() => {
      updateZenMode({
        ...zenMode,
        showHelpButton: true,
        showExternalLinks: true,
        showWallet: false,
      });
    }, 3000);
  }, []);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Hub) return; // we are not on the hub page, so don't update zen mode
    updateZenMode({
      ...zenMode,
      showHelpButton: showHubNav,
      showExternalLinks: showHubNav,
      showWallet: showWalletButton,
    });
  }, [active, currentHelpRoute, showWalletButton]);

  return (
    <div
      className={clx(
        "flex flex-col items-center justify-center text-center text-green",
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
        onEnter={() => {
          updateIntroLeft(false);
        }}
        onLeft={() => {
          updateIntroLeft(true);
        }}
      />
      <div className={showHub ? "block" : "hidden"}>
        <div className="flex">
          <Link
            to="/forest"
            className={clx(
              "hidden md:flex  flex-col justify-center transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center nowrap">
              <IoChevronBackOutline className="inline" size={24} />
              <span>Forest</span>
            </div>
          </Link>
          {myTree && (
            <DynamicTree
              details={myTree}
              className={`FloatingTree mb-8`}
              onClick={() => {
                updateShowHubNav(!showHubNav);
              }}
            />
          )}
          <Link
            to="/grow"
            className={clx(
              "hidden md:flex flex-col justify-center transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center nowrap">
              <span>Grow</span>
              <IoChevronForwardOutline className="inline" size={24} />
            </div>
          </Link>
        </div>
        <div className="w-full mt-2 text-center">
          {myTree?.metadata?.type?.level !== undefined &&
          myTree?.metadata?.type?.level > 0 ? (
            <div
              className={clx(
                "transition-opacity ease-in duration-500",
                showHubNav ? "opacity-100" : "opacity-0"
              )}
            >
              <Link to="/stake">
                <Button variant="outline">{stakeButtonMessage}</Button>
              </Link>
            </div>
          ) : (
            <div
              className={clx(
                "transition-opacity ease-in duration-500",
                showHub ? "opacity-100" : "opacity-0"
              )}
            >
              <Link to="/stake">
                <Button variant="outline">{stakeButtonMessage}</Button>
              </Link>
            </div>
          )}
          <div
            className={clx(
              "flex md:hidden justify-between my-4 transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <Link to="/forest" className="flex items-center">
              <div className="flex items-center nowrap">
                <IoChevronBackOutline className="inline" size={24} />
                <span>Forest</span>
              </div>
            </Link>
            <Link to="/grow" className="flex items-center">
              <div className="flex items-center nowrap">
                <span>Grow</span>
                <IoChevronForwardOutline className="inline" size={24} />
              </div>
            </Link>
          </div>
          <div
            className={clx(
              "transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <Link to="/lock" className="block w-full mt-4 leading-none">
              Lock
              <br />
              <IoChevronDownOutline className="inline-block" size={24} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const HubApp = forwardRef(_HubApp);

export { HubApp };
