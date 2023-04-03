import clx from "classnames";
import {
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
  type PropsWithChildren,
  useEffect,
} from "react";
import { GiPresent } from "react-icons/gi";
import { IoChevronBackOutline } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AppRoute } from "../Routes";
import { useModal, useScript } from "../common/hooks";
import { useForest, useHelp, useZenMode } from "../common/context";
import { Button, DynamicTree } from "../common/components";
import { SendGSolModal } from "../common/components/modals/SendGSolModal";
import { useSunriseStore } from "../common/store/useSunriseStore";
import { OrgButtonContent } from "./OrgButtonContent";
import { charityApps } from "./charities";
import { CharityDonateButton } from "./components/CharityDonateButton";
import { CollectInfoButton } from "./components/CollectInfoButton";
import { PartnerApp } from "./components/PartnerApp";
import {
  type Charity,
  type Partner,
  type PlaceholderOrg,
} from "./components/types";
import { partnerApps } from "./partners";

const isRealCharity = (
  charity: Charity | PlaceholderOrg
): charity is Charity => {
  return (charity as Charity).address !== undefined;
};

const isRealPartner = (
  partner: Partner | PlaceholderOrg
): partner is Partner => {
  return (partner as Partner).website !== undefined;
};

const Placeholder: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-green-light border border-green-light p-8 rounded-md w-40 h-40 hover:scale-110 hover:brightness-125 hover:transition-all text-green text-xl font-medium text-center">
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
  const wallet = useSunriseStore((state) => state.wallet);
  useEffect(() => {
    if (!wallet.connected && location.state?.address === undefined)
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
          {partnerApps.map((app) =>
            isRealPartner(app) ? (
              <PartnerApp partner={app} key={app.name}>
                <OrgButtonContent>{app.name}</OrgButtonContent>
              </PartnerApp>
            ) : (
              <CollectInfoButton imageUrl={app.imageUrl} key={app.name}>
                <OrgButtonContent>{app.name}</OrgButtonContent>
              </CollectInfoButton>
            )
          )}
        </div>
      </div>
      <h2 className="flex font-bold text-xl items-center gap-4 mt-8 mb-4 text-green">
        Donate gSOL.
      </h2>
      <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[50%] max-w-xl">
        <div className="flex overflow-x-scroll gap-4 p-4">
          <CollectInfoButton>
            <Placeholder>Your Org Here</Placeholder>
          </CollectInfoButton>
          {charityApps.map((charity) =>
            isRealCharity(charity) ? (
              <CharityDonateButton charity={charity} key={charity.name} />
            ) : (
              <CollectInfoButton imageUrl={charity.imageUrl} key={charity.name}>
                <OrgButtonContent>Impact Org</OrgButtonContent>
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
