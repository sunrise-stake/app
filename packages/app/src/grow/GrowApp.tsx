import { forwardRef, useState, type ForwardRefRenderFunction } from "react";
import clx from "classnames";
import { SendGSolForm } from "./components/SendGSolForm";
import { InfoBox } from "../common/components";
import { toast } from "react-hot-toast";
import { AiOutlineArrowRight } from "react-icons/ai";
import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { toSol, type Details } from "@sunrisestake/client";
import BN from "bn.js";
import { ZERO } from "../common/utils";
import { Keypair } from "@solana/web3.js";
import { Transition } from "@headlessui/react";
import { useScript } from "../common/hooks";

export interface Charity {
  name: string;
  walletAddress: string;
}

const _GrowApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  const {
    details,
  }: {
    details: Details | undefined;
  } = useSunriseStake();

  useScript("//embed.typeform.com/next/embed.js");

  const [charity, setCharity] = useState<Charity | undefined>();
  const [recipientAddress, setRecipientAddress] = useState("");

  // These will be fetch from some data base
  const charityApps = [
    {
      name: "Green Glow",
      walletAddress: Keypair.generate().publicKey.toBase58(),
    },
    {
      name: "Project Green",
      walletAddress: Keypair.generate().publicKey.toBase58(),
    },
    {
      name: "Animal Kingdom",
      walletAddress: Keypair.generate().publicKey.toBase58(),
    },
    {
      name: "Cool Ocean",
      walletAddress: Keypair.generate().publicKey.toBase58(),
    },
    {
      name: "Clean Earth",
      walletAddress: Keypair.generate().publicKey.toBase58(),
    },
    {
      name: "Bee Responsive",
      walletAddress: Keypair.generate().publicKey.toBase58(),
    },
  ];
  const partnerApps = Array.from({ length: 10 }, (x, i) => i);
  return (
    <div
      className={clx(
        "flex flex-col justify-start items-start sm:justify-center sm:items-center p-8",
        className
      )}
      ref={ref}
      {...rest}
    >
      <h1 className="font-bold text-3xl text-green mt-96 pt-96">
        Grow your forest
      </h1>
      <Transition className="mb-8" show={true}>
        <Transition.Child
          as="img"
          src={
            details?.balances.gsolBalance === null ||
            details?.balances.gsolBalance.uiAmount === 0
              ? "/placeholder-sapling.png"
              : "/placeholder-tree.png"
          }
          className={"FloatingTree"}
          enterFrom="opacity-0"
          enterTo="opacity-100"
          enter="transition-opacity ease-in duration-500"
        />
      </Transition>
      <h2 className="flex font-bold text-xl items-center gap-4 mb-8">
        Partners{" "}
        <AiOutlineArrowRight
          onClick={() => {
            toast("Will show a page with all partners");
          }}
        />
      </h2>
      <div className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl0">
        <div className="flex overflow-x-scroll gap-4 pb-4">
          <button
            data-tf-popup="ycDtkUgC"
            data-tf-opacity="100"
            data-tf-size="100"
            data-tf-iframe-props="title=Partner Contacts"
            data-tf-transitive-search-params
            data-tf-medium="snippet"
          >
            <div className="hover:cursor-pointer">
              <InfoBox className="p-8 rounded-md w-40 h-30">
                <div className="text-green text-xl font-medium text-center">
                  Your App here
                </div>
              </InfoBox>
            </div>
          </button>
          {partnerApps.map((app) => {
            return (
              <div
                className="hover:cursor-pointer"
                key={app}
                onClick={() => {
                  toast("Coming so0n!", { position: "top-center" });
                }}
              >
                <InfoBox className="p-8 rounded-md w-40 h-30">
                  <div className="text-green text-xl font-medium text-center">
                    Partner App
                  </div>
                </InfoBox>
              </div>
            );
          })}
        </div>
      </div>
      <h2 className="font-bold text-xl mt-8 mb-4">Transfer gSOL</h2>
      <SendGSolForm
        className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl"
        charity={charity}
        recipient={recipientAddress}
        setRecipient={setRecipientAddress}
      />
      <div className="flex gap-2 w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl mt-4">
        Balance:{" "}
        <div className="text-green font-bold">
          {toSol(new BN(details?.balances.gsolBalance.amount ?? ZERO))} gSOL
        </div>
      </div>
      <h2 className="flex font-bold text-xl items-center gap-4 mt-16 mb-8">
        Donate gSOL{" "}
        <AiOutlineArrowRight
          onClick={() => {
            toast("Will show a page with all partners");
          }}
        />
      </h2>

      <div className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl">
        <div className="flex overflow-x-scroll gap-4 pb-8">
          {charityApps.map((charity) => {
            return (
              <div
                className="hover:cursor-pointer"
                key={charity.name}
                onClick={() => {
                  setCharity(charity);
                  setRecipientAddress(charity.walletAddress);
                  toast("Coming soon!", { position: "bottom-center" });
                }}
              >
                <InfoBox className="p-8 rounded-md w-40 h-30">
                  <div className="text-green text-xl font-medium text-center">
                    {charity.name}
                  </div>
                </InfoBox>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const GrowApp = forwardRef(_GrowApp);

export { GrowApp };
