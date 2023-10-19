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
import { Button, Spinner } from "../common/components";
import { useZenMode } from "../common/context/ZenModeContext";
import { HubIntro } from "./components/HubIntro";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useCarbon } from "../common/hooks";
import { useForest } from "../common/context/forestContext";
import { useHelp } from "../common/context/HelpContext";
import { AppRoute } from "../Routes";
import { LinkWithQuery } from "../common/components/LinkWithQuery";
import { useScreenOrientation } from "./hooks/useScreenOrientation";

const LINK_CHEVRON_SIZE = 32;

const _HubApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const wallet = useWallet();
  const { setCurrentHelpRoute, currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();
  const { myTree } = useForest();
  const { totalCarbon } = useCarbon();

  const [showIntro, updateShowIntro] = useState(false);
  const [introLeft, updateIntroLeft] = useState(false);
  const [showHubNav, updateShowHubNav] = useState(false);

  const wasHubNavShown = useRef(false);
  const { screenType } = useScreenOrientation();
  const showWalletButton = useMemo(() => {
    return wallet.connected && showHubNav;
  }, [wallet.connected, showHubNav]);
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
    console.log("ShowHub useEffect");
    if (myTree) {
      const showNavTid = setTimeout(() => {
        console.log("ShowHub useEffect timeout");
        if (!wasHubNavShown.current) {
          updateShowHubNav(true);
        } else {
          console.log("ShowHub useEffect timeout else", {
            wasHubNavShown: wasHubNavShown.current,
          });
        }
      }, 3000);

      const showLinksTid = setTimeout(() => {
        console.log("showLinks useEffect timeout");
        updateZenMode((prev) => ({
          ...prev,
          showExternalLinks: screenType !== "mobilePortrait",
        }));
      }, 6000);

      return () => {
        console.log("ShowHub useEffect cleanup");
        clearTimeout(showNavTid);
        clearTimeout(showLinksTid);
      };
    } else {
      console.log("ShowHub useEffect else", { introLeft, myTree });
    }
  }, [myTree, introLeft]);

  useEffect(() => {
    if (showHubNav) wasHubNavShown.current = true;
    updateZenMode((prev) => ({
      ...prev,
      showHelpButton: showHubNav,
      showWallet: showWalletButton,
    }));
  }, [showHubNav, showWalletButton]);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Hub) return; // we are not on the hub page, so don't update zen mode
    updateZenMode((prev) => ({
      ...prev,
      showHelpButton: showHubNav,
      showWallet: showWalletButton,
    }));
  }, [active, currentHelpRoute, showHubNav, showWalletButton]);

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
          <LinkWithQuery
            to="/forest"
            className={clx(
              "hidden md:flex  flex-col justify-center transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center nowrap text-2xl">
              <IoChevronBackOutline
                className="inline"
                size={LINK_CHEVRON_SIZE}
              />
              <span>Forest</span>
            </div>
          </LinkWithQuery>
          {myTree && (
            <DynamicTree
              details={myTree}
              className={`FloatingTree mb-8`}
              onClick={() => {
                updateShowHubNav(!showHubNav);
              }}
            />
          )}
          <LinkWithQuery
            to="/grow"
            className={clx(
              "hidden md:flex flex-col justify-center transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex relative items-center nowrap text-2xl">
              <span>Grow</span>
              <IoChevronForwardOutline
                className="inline"
                size={LINK_CHEVRON_SIZE}
              />
            </div>
          </LinkWithQuery>
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
              <LinkWithQuery to="/stake">
                <Button variant="outline" size="lg">
                  {stakeButtonMessage}
                </Button>
              </LinkWithQuery>
            </div>
          ) : (
            <div
              className={clx(
                "transition-opacity ease-in duration-500",
                showHub ? "opacity-100" : "opacity-0"
              )}
            >
              <LinkWithQuery to="/stake">
                <Button variant="outline">{stakeButtonMessage}</Button>
              </LinkWithQuery>
            </div>
          )}
          <div
            className={clx(
              "flex md:hidden justify-between my-4 transition-opacity ease-in duration-500",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <LinkWithQuery to="/forest" className="flex items-center">
              <div className="flex items-center nowrap text-2xl">
                <IoChevronBackOutline
                  className="inline"
                  size={LINK_CHEVRON_SIZE}
                />
                <span>Forest</span>
              </div>
            </LinkWithQuery>
            <LinkWithQuery to="/grow" className="flex items-center">
              <div className="flex items-center nowrap text-2xl relative">
                <span>Grow</span>
                <IoChevronForwardOutline
                  className="inline"
                  size={LINK_CHEVRON_SIZE}
                />
              </div>
            </LinkWithQuery>
          </div>
          <div
            className={clx(
              "transition-opacity ease-in duration-500 flex flex-row",
              showHubNav ? "opacity-100" : "opacity-0"
            )}
          >
            <LinkWithQuery
              to="/lock"
              className="block w-full mt-4 leading-none"
            >
              <div className="relative inline-block">
                <span className="text-2xl">Lock</span>
              </div>
              <br />
              <IoChevronDownOutline
                className="inline-block"
                size={LINK_CHEVRON_SIZE}
              />
            </LinkWithQuery>
            <LinkWithQuery
              to="/referral"
              className="block w-full mt-4 leading-none"
            >
              <div className="relative inline-block">
                <span className="text-2xl">Referral</span>
              </div>
              <br />
              <IoChevronDownOutline
                className="inline-block"
                size={LINK_CHEVRON_SIZE}
              />
            </LinkWithQuery>
          </div>
        </div>
      </div>
    </div>
  );
};

const HubApp = forwardRef(_HubApp);

export { HubApp };
