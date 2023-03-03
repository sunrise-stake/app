import { forwardRef, type ForwardRefRenderFunction } from "react";
import clx from "classnames";
import { SendGSolForm } from "./components/SendGSolForm";
import { InfoBox } from "../common/components";
import { toast } from "react-hot-toast";
import { AiOutlineArrowRight } from "react-icons/ai";

const _GrowApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  // These will be fetch from some data base
  const charityApps = Array.from({ length: 10 }, (x, i) => i);
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
      <h1 className="font-bold text-3xl text-green mb-16">Grow your forest</h1>
      <h2 className="flex font-bold text-xl items-center gap-4">
        Partners{" "}
        <AiOutlineArrowRight
          onClick={() => {
            toast("Will show a page with all partners");
          }}
        />
      </h2>
      <div className="flex w-[50%] overflow-scroll p-4 items-stretch">
        <div
          className="hover:cursor-pointer"
          onClick={() => {
            toast("Will open a form");
          }}
        >
          <InfoBox className="p-8 rounded-md mr-4">
            <div className="text-green text-xl font-medium text-center">
              Your App here
            </div>
          </InfoBox>
        </div>
        {partnerApps.map((app) => {
          return (
            <div
              className="hover:cursor-pointer"
              key={app}
              onClick={() => {
                toast("Coming soon!", { position: "top-center" });
              }}
            >
              <InfoBox className="p-8 rounded-md mr-4">
                <div className="text-green text-xl font-medium text-center">
                  Partner App
                </div>
              </InfoBox>
            </div>
          );
        })}
      </div>
      <h2 className="font-bold text-xl mt-8">Gift a tree</h2>
      <SendGSolForm />
      <h2 className="font-bold text-xl mt-8">Donate gSOL</h2>

      <div className="flex w-[50%] overflow-scroll p-4">
        {charityApps.map((app) => {
          return (
            <div
              className="hover:cursor-pointer"
              key={app}
              onClick={() => {
                toast("Coming soon!", { position: "bottom-center" });
              }}
            >
              <InfoBox className="p-8 rounded-md mr-4">
                <div className="text-green text-xl font-medium text-center">
                  Charity App
                </div>
              </InfoBox>
            </div>
          );
        })}
        <InfoBox className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">See all</div>
        </InfoBox>
      </div>
    </div>
  );
};

const GrowApp = forwardRef(_GrowApp);

export { GrowApp };
