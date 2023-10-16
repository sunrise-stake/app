import React, {
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
  type PropsWithChildren,
  useEffect,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";

import { useZenMode } from "../common/context/ZenModeContext";
import { IoChevronUpOutline } from "react-icons/io5";
import { AppRoute } from "../Routes";
import { useHelp } from "../common/context/HelpContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { LinkWithQuery } from "../common/components/LinkWithQuery";
import { TopicContainer } from "../common/container/TopicContainer";
import { Card } from "../common/container/Card";
import { ReferralOptions } from "./ReferralOptions";
import { ReferralLink } from "./ReferralLink";
import { isMobilePortrait } from "../common/utils";
import { useWindowSize } from "usehooks-ts";

const Title: FC = () => (
  <div className="topic-title w-full mt-8">
    <LinkWithQuery
      to="/"
      className="flex items-center text-green justify-center"
    >
      <div className="flex items-center nowrap">
        <IoChevronUpOutline className="inline" size={48} />
      </div>
    </LinkWithQuery>
    <h1 className="font-bold text-green-light text-4xl text-center mb-4">
      Share Your Referral Link
    </h1>
  </div>
);

const Wrapper: FC<PropsWithChildren> = ({ children }) => {
  const windowSize = useWindowSize();
  const isPortrait = useMemo(
    () => isMobilePortrait(window.innerWidth),
    [windowSize]
  );

  return isPortrait ? (
    <div>{children}</div>
  ) : (
    <Card size="large" orientation="horizontal">
      {children}
    </Card>
  );
};

const _ReferralApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const { currentHelpRoute } = useHelp();
  const [, updateZenMode] = useZenMode();

  const navigate = useNavigate();
  const wallet = useWallet();
  useEffect(() => {
    if (!wallet.connected && active) navigate("/");
  }, [active, wallet.connected]);

  const link =
    wallet.publicKey === null
      ? null
      : `https://app.sunrisestake.com?referrer=${wallet.publicKey.toBase58()}`;

  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Lock) return; // we are not on the lock page, so don't update zen mode
    updateZenMode({
      showBGImage: false,
      showHelpButton: true,
      showExternalLinks: false,
      showWallet: active,
    });
  }, [active, currentHelpRoute]);

  return (
    <TopicContainer
      className={className}
      ref={ref}
      {...rest}
      titleContents={<Title />}
    >
      {link === null && (
        <div className="flex flex-col items-center m-4">
          <h1 className="text-3xl text-center">Loading...</h1>
          <div
            className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full mt-4"
            role="status"
          ></div>
        </div>
      )}
      {link !== null && (
        <div className="mx-4 mb-3 flex flex-col items-center">
          <Wrapper>
            <ReferralOptions link={link} />
            <ReferralLink link={link} />
          </Wrapper>
        </div>
      )}
    </TopicContainer>
  );
};

const ReferralApp = forwardRef(_ReferralApp);

export { ReferralApp };
