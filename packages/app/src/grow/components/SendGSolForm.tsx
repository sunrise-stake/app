import clx from "classnames";
import { type FC } from "react";
import { Button } from "../../common/components";

interface Props {
  className?: string;
}

const SendGSolForm: FC<Props> = ({ className }) => (
  <div
    className={clx(
      "bg-gray-300 backdrop-blur-sm px-8 py-4 rounded-md w-full sm:w-[50%]",
      className
    )}
  >
    <div className="flex flex-col">
      <div className="font-semibold text-xl">Send</div>
      <input />
      <div className="font-semibold text-xl">To</div>
      <input className="mb-4" />
      <Button>Send</Button>
    </div>
  </div>
);

export { SendGSolForm };
