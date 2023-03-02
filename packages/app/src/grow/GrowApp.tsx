import { type FC } from "react";
import clx from "classnames";
import { PartnerApp } from "./components/PartnerApp";
import { SendGSolForm } from "./components/SendGSolForm";

const GrowApp: FC<
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }) => {
  return (
    <div
      className={clx(
        "container flex flex-col justify-start items-start sm:justify-center sm:items-center p-8",
        className
      )}
      {...rest}
    >
      <h2 className="font-bold text-xl">Partners</h2>
      <div className="flex">
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Your App here</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Your App here</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Your App here</div>
        </PartnerApp>
      </div>
      <h2 className="font-bold text-xl mt-8">Gift a tree</h2>
      <SendGSolForm />
      <h2 className="font-bold text-xl mt-8">Donate gSOL</h2>
      <div className="flex">
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Charity App</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Charity App</div>
        </PartnerApp>
        <PartnerApp className="p-8 rounded-md mr-4">
          <div className="text-green text-xl font-medium">Charity App</div>
        </PartnerApp>
      </div>
    </div>
  );
};

export { GrowApp };
