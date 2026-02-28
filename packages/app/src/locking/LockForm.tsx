import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";
import { Popover } from "@headlessui/react";

import { useSunriseStake } from "../common/context/sunriseStakeContext";
import { ZERO } from "../common/utils";
import { AmountInput, Panel } from "../common/components";

interface LockFormProps {
  lock: (amount: string) => Promise<any>;
}
const LockForm: React.FC<LockFormProps> = () => {
  const { details } = useSunriseStake();
  const [amount, setAmount] = useState("");
  const [, setValid] = useState(false);

  return (
    <Panel className="flex flex-row mx-auto mb-9 p-3 sm:p-4 rounded-lg w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl">
      <AmountInput
        className="mr-4 basis-3/4"
        token="gSOL"
        balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
        amount={amount}
        setAmount={setAmount}
        setValid={setValid}
        mode="LOCK"
        variant="small"
      />
      <Popover className="relative mr-auto sm:mr-0 m-auto">
        <Popover.Button className="inline-flex items-center border-2 rounded-lg leading-6 shadow-sm border-green bg-green text-white px-4 py-2 text-base opacity-50">
          Lock <FiArrowDownLeft className="inline ml-1" size={24} />
        </Popover.Button>
        <Popover.Panel className="absolute z-[100] bottom-full right-0 mb-2 bg-danger text-white text-sm rounded-lg p-4 w-64 shadow-xl">
          Locking is disabled. Sunrise is shutting down - please withdraw your
          SOL.
        </Popover.Panel>
      </Popover>
    </Panel>
  );
};

export { LockForm };
