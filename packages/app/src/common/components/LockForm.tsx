import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import { useSunriseStake } from "../context/sunriseStakeContext";
import { ZERO } from "../utils";
import { AmountInput, Button, Panel, Spinner } from "./";

interface LockFormProps {
  lock: (amount: string) => Promise<any>;
}
const LockForm: React.FC<LockFormProps> = ({ lock }) => {
  const { details } = useSunriseStake();
  const [amount, setAmount] = useState("");
  const [valid, setValid] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  return (
    <Panel className="flex flex-row mx-auto mb-9 p-3 sm:p-4 rounded-lg">
      <AmountInput
        className="mr-4"
        token="gSOL"
        balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
        amount={amount}
        setAmount={setAmount}
        setValid={setValid}
        mode="LOCK"
        variant="small"
      />
      <Button
        onClick={() => {
          setIsBusy(true);
          lock(amount).finally(() => {
            setIsBusy(false);
          });
        }}
        disabled={!valid || isBusy}
        className="mr-auto sm:mr-0 m-auto"
      >
        {isBusy ? <Spinner size="1rem" className="mr-1" /> : null}
        Lock <FiArrowDownLeft className="inline" size={24} />
      </Button>
    </Panel>
  );
};

export { LockForm };
