import React, {
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
  type PropsWithChildren,
  useEffect,
} from "react";
import clx from "classnames";
import { Link, useNavigate } from "react-router-dom";
import { useZenMode } from "../common/context/ZenModeContext";
import { useModal, useScript } from "../common/hooks";
import { IoChevronBackOutline } from "react-icons/io5";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { useForest } from "../common/context/forestContext";
import { CollectInfoButton } from "./components/CollectInfoButton";
import { Button } from "../common/components";
import { GiPresent } from "react-icons/gi";
import { SendGSolModal } from "../common/components/modals/SendGSolModal";
import { CharityDonateButton } from "./components/CharityDonateButton";
import { useHelp } from "../common/context/HelpContext";
import { AppRoute } from "../Routes";
import { useWallet } from "@solana/wallet-adapter-react";
import { charityApps } from "./charities";
import { partners } from "./partners";
import { PartnerButton } from "./components/PartnerButton";
import { OrgButtonContent } from "./OrgButtonContent";
import { MangroveButton } from "../rewards/components/MangroveButton";

const Placeholder: FC<PropsWithChildren> = ({ children }) => (
  <div className="transition-all text-xl font-medium text-center text-green hover:text-green-light border border-green hover:border-green-light p-8 rounded-md w-40 h-40 hover:scale-105 hover:brightness-105">
    <div className="pt-4">{children}</div>
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

  const navigate = useNavigate();
  const wallet = useWallet();
  useEffect(() => {
    if (!wallet.connected && active) navigate("/");
  }, [active, wallet.connected]);

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Grow) return; // we are not on the grow page, so don't update zen mode
    updateZenMode({
      showBGImage: false,
      showHelpButton: true,
      showExternalLinks: false,
      showWallet: active,
    });
  }, [active, currentHelpRoute]);

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
      <MangroveButton />
      <h2 className="flex font-bold text-xl items-center gap-4 mb-4 text-green">
        Use gSOL with our partners.
      </h2>
      <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[50%] max-w-xl">
        <div className="flex overflow-x-scroll overflow-y-hidden gap-4 p-4">
          <CollectInfoButton>
            <Placeholder>Your App Here</Placeholder>
          </CollectInfoButton>
          {partners.map((partner) => (
            <PartnerButton partner={partner} key={partner.name}>
              <OrgButtonContent>{partner.name}</OrgButtonContent>
            </PartnerButton>
          ))}
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
          {charityApps.map((charity) => (
            <CharityDonateButton charity={charity} key={charity.name} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="container font-bold text-xl mt-8 mb-4 text-green text-center">
          Send a gift to add someone to your forest.
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
