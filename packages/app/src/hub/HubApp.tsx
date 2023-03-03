import { Transition } from "@headlessui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import clx from "classnames";
import {
  useEffect,
  useState,
  type ForwardRefRenderFunction,
  type Dispatch,
  type SetStateAction,
  forwardRef,
} from "react";
import { Link } from "react-router-dom";
import { Button, Spinner } from "../common/components";
import { useBGImage } from "../common/context/BGImageContext";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { HubIntro } from "./components/HubIntro";
import { NavArrow } from "./components/NavArrow";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useTrees } from "../forest/hooks/useTrees";

const isNullish = (val: any): boolean =>
  val === null || val === undefined || val === 0;

const _HubApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  const wallet = useWallet();

  const { details } = useSunriseStake();
  const [gsolBalance, updateGsolBalance]: [
    number | null | undefined,
    Dispatch<SetStateAction<number | null | undefined>>
  ] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    updateGsolBalance(details?.balances.gsolBalance.uiAmount ?? undefined);
  }, [details?.balances?.gsolBalance]);

  const [showIntro, updateShowIntro] = useState(false);
  const [introLeft, updateIntroLeft] = useState(false);
  const [showHub, updateShowHub] = useState(false);
  const [showHubNav, updateShowHubNav] = useState(false);
  const [, updateShowBGImage] = useBGImage();

  const { myTree } = useTrees();

  useEffect(() => {
    if (!wallet.connected) updateShowIntro(true);
    else updateIntroLeft(true);
  }, []);

  useEffect(() => {
    if (wallet.connected) updateShowIntro(false);
  }, [wallet.connected]);

  useEffect(() => {
    if (introLeft && myTree)
      // TODO: Remove timeout!
      setTimeout(() => {
        updateShowHub(true);
        updateShowBGImage(false);
      }, 3000);
  }, [myTree, introLeft]);

  return (
    <div
      className={clx(
        "flex flex-col items-center justify-center text-center",
        className
      )}
      ref={ref}
      {...rest}
    >
      <HubIntro
        show={showIntro}
        onLeft={() => {
          updateIntroLeft(true);
        }}
      />
      <Spinner className={introLeft && !showHub ? "block" : "hidden"} />
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
          <Transition className="mb-8" show={showHub}>
            <Transition.Child
              // as={DynamicTree}
              // details={myTree}
              // src={
              //   // TODO: "Dry tree" case
              //   gsolBalance === null || gsolBalance === 0
              //     ? "/placeholder-sapling.png"
              //     : "/placeholder-tree.png"
              // }
              // className={!isNullish(gsolBalance) ? "FloatingTree" : "blur-[2px]"}
              // onClick={() => {
              //   updateShowHubNav(true);
              // }}
              enterFrom="opacity-0"
              enterTo="opacity-100"
              enter="transition-opacity ease-in duration-500"
            />
            <DynamicTree
              details={myTree}
              className="FloatingTree"
              onClick={() => {
                updateShowHubNav(true);
              }}
              style={{
                // TODO TEMP - move them into classes
                width: "300px",
              }}
            />
          </Transition>
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
          <Button>
            {!isNullish(gsolBalance) ? "My Stake" : "Stake to grow your tree"}
          </Button>
        </Link>
        <Link to="/lock" className="block w-full mt-2">
          <NavArrow direction="down" className="mx-auto" />
          Lock
        </Link>
      </div>
    </div>
  );
};

const HubApp = forwardRef(_HubApp);

export { HubApp };
