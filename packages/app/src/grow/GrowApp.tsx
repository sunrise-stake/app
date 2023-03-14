import React, {
  forwardRef,
  useEffect,
  type ForwardRefRenderFunction,
  type PropsWithChildren,
  type FC,
} from "react";
import clx from "classnames";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useZenMode } from "../common/context/ZenModeContext";
import { useModal, useScript } from "../common/hooks";
import { IoChevronBackOutline } from "react-icons/io5";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useForest } from "../common/context/forestContext";
import { CollectInfoButton } from "./components/CollectInfoButton";
import { Button } from "../common/components";
import { GiPresent } from "react-icons/gi";
import { SendGSolModal } from "../common/components/modals/SendGSolModal";
import { type Charity, type PlaceholderCharity } from "./components/types";
import { CharityDonateButton } from "./components/CharityDonateButton";
import { useHelp } from "../common/context/HelpContext";
import { AppRoute } from "../Routes";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

const isRealCharity = (
  charity: Charity | PlaceholderCharity
): charity is Charity => {
  return (charity as Charity).address !== undefined;
};

// These will be fetched from some data base
const charityApps: Array<Charity | PlaceholderCharity> = [
  {
    name: "Diamante Bridge Collective",
    imageUrl: "partners/DBCLogo.png",
    address: new PublicKey("HPiGWWLmV8R1UET84Bf1BnsPtRYcQessRdms4oFxe6sW"),
    website: "http://diamantebridge.org/",
  },
  {
    name: "Charity 1",
    imageUrl: "partners/charity0.png",
  },
  {
    name: "Charity 2",
    imageUrl: "partners/charity1.png",
  },
  {
    name: "Charity 3",
    imageUrl: "partners/charity2.png",
  },
  {
    name: "Charity 4",
    imageUrl: "partners/charity3.png",
  },
];
const partnerApps = [
  {
    name: "Demo Partner 1",
    url: "https://example.test",
    imageUrl: "partners/partner0.png",
  },
  {
    name: "Demo Partner 2",
    url: "https://example.test",
    imageUrl: "partners/partner1.png",
  },
  {
    name: "Demo Partner 3",
    url: "https://example.test",
    imageUrl: "partners/partner2.png",
  },
];

const Placeholder: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-green-light border border-green-light p-8 rounded-md w-40 h-40 hover:scale-110 hover:brightness-125 hover:transition-all text-green text-xl font-medium text-center">
    {children}
  </div>
);

const Overlay: FC<PropsWithChildren> = ({ children }) => (
  <div className="p-8 rounded-md w-40 h-30 text-white font-extrabold text-xl font-medium text-center">
    {children}
  </div>
);

const _GrowApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();

  useScript("//embed.typeform.com/next/embed.js");

  const { myTree } = useForest();

  const location = useLocation();
  const navigate = useNavigate();
  const wallet = useWallet();
  useEffect(() => {
    if (!wallet.connected && location.state?.address !== undefined)
      navigate("/");
  }, [wallet.connected]);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Grow) return; // we are not on the grow page, so don't update zen mode
    updateZenMode({
      showBGImage: false,
      showHelpButton: true,
      showExternalLinks: false,
      showWallet: active,
    });
  }, [active]);

  const sendGSolModal = useModal(() => {});

  return (
    <div
      className={clx("relative flex flex-col items-center pt-8", className)}
      ref={ref}
      {...rest}
    >
      <SendGSolModal
        ok={sendGSolModal.onModalOK}
        cancel={sendGSolModal.onModalClose}
        show={sendGSolModal.modalShown}
      />
      {myTree && (
        <DynamicTree
          details={myTree}
          variant="sm"
          className={`-mt-10 -mb-14`}
        />
      )}
      <div className="">
        <h1 className="mb-4 font-bold text-green-light text-3xl">
          Grow your forest
        </h1>
      </div>
      <h2 className="flex font-bold text-xl items-center gap-4 mb-4 text-green">
        Use gSOL with our partners.
      </h2>
      <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[50%] max-w-xl">
        <div className="flex overflow-x-scroll gap-4 p-4">
          <CollectInfoButton>
            <Placeholder>
              <div className="pt-4">Your App Here</div>
            </Placeholder>
          </CollectInfoButton>
          {partnerApps.map((app) => (
            <CollectInfoButton imageUrl={app.imageUrl} key={app.name}>
              <Overlay>Partner</Overlay>
            </CollectInfoButton>
          ))}
        </div>
      </div>
      <h2 className="flex font-bold text-xl items-center gap-4 mt-8 mb-4 text-green">
        Donate gSOL.
      </h2>
      <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[50%] max-w-xl">
        <div className="flex overflow-x-scroll gap-4 p-4">
          <CollectInfoButton>
            <Placeholder>Your Charity Here</Placeholder>
          </CollectInfoButton>
          {charityApps.map((charity) =>
            isRealCharity(charity) ? (
              <CharityDonateButton charity={charity} key={charity.name} />
            ) : (
              <CollectInfoButton imageUrl={charity.imageUrl} key={charity.name}>
                <Overlay>Charity</Overlay>
              </CollectInfoButton>
            )
          )}
        </div>
      </div>
      <div>
        <h2 className="container font-bold text-xl mt-8 mb-4 text-green text-center">
          Send gSOL to add someone to your forest.
        </h2>
        <div className="flex justify-center items-center mb-8">
          <Button
            className="basis-1/4"
            onClick={sendGSolModal.trigger}
            size="sm"
          >
            <div className="flex gap-2 w-full justify-center items-center">
              <GiPresent size={32} />
            </div>
          </Button>
        </div>
      </div>
      <div className="absolute top-0 left-0 mt-4">
        <div className="container">
          <Link to="/" className="flex items-center text-green">
            <div className="flex items-center nowrap">
              <IoChevronBackOutline className="inline" size={48} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

const GrowApp = forwardRef(_GrowApp);

export { GrowApp };
