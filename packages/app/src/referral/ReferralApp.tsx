import clx from "classnames";
import {
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";

import { useZenMode } from "../common/context/ZenModeContext";
import { IoChevronUpOutline } from "react-icons/io5";
import { AppRoute } from "../Routes";
import { useHelp } from "../common/context/HelpContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { LinkWithQuery } from "../common/components/LinkWithQuery";
import { Card } from "../common/container/Card";
import { ReferralOptions } from "./ReferralOptions";

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
    <h1 className="font-bold text-green-light text-3xl text-center mb-4">
      Share Your Referral Link
    </h1>
  </div>
);

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
    updateZenMode((prev) => ({
      ...prev,
      showBGImage: false,
      showHelpButton: true,
      showWallet: active,
      showExternalLinks: true,
    }));
  }, [active, currentHelpRoute]);

  return (
    <div
      className={clx("relative flex flex-col items-center pt-8", className)}
      ref={ref}
      {...rest}
    >
      <Title />
      <div className="relative flex flex-col items-center pt-8"></div>
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
        <div className="mb-20 flex flex-col items-center">
          <Card
            className="bg-green-light"
            size="large"
            orientation="horizontal"
          >
            <ReferralOptions link={link} />
          </Card>
        </div>
      )}
    </div>
  );
};

const ReferralApp = forwardRef(_ReferralApp);

export { ReferralApp };
