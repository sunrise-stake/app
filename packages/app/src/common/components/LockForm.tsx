import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import { Button } from "./Button";
import AmountInput from "./AmountInput";
import { useSunriseStake } from "../context/sunriseStakeContext";
import { ZERO } from "../utils";
import Spinner from "./Spinner";

interface LockFormProps {
  lock: (amount: string) => Promise<any>;
}
const LockForm: React.FC<LockFormProps> = ({ lock }) => {
  const { details } = useSunriseStake();
  const [amount, setAmount] = useState("");
  const [valid, setValid] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  return (
    <div>
      <AmountInput
        className="mb-5"
        token="gSOL"
        balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
        amount={amount}
        setAmount={setAmount}
        setValid={setValid}
        mode="LOCK"
      />
      <div className="flex flex-col-reverse gap-4 sm:flex-row justify-between">
        <Button
          onClick={() => {
            setIsBusy(true);
            lock(amount).finally(() => {
              setIsBusy(false);
            });
          }}
          disabled={!valid || isBusy}
          className="mr-auto sm:mr-0"
        >
          {isBusy ? <Spinner size="1rem" className="mr-1" /> : null}
          Lock <FiArrowDownLeft className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default LockForm;
