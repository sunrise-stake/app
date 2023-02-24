import type BN from "bn.js";
import React, { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";

import { useModal } from "../../common/hooks";
import { AmountInput, Button, Spinner } from "../../common/components";
import { DepositWarningModal } from "../../common/components/modals";

interface StakeFormProps {
  deposit: (amount: string) => Promise<any>;
  solBalance: BN | undefined;
}

const StakeForm: React.FC<StakeFormProps> = ({ deposit, solBalance }) => {
  const [amount, setAmount] = useState("");
  const [valid, setValid] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const depositModal = useModal(() => {
    setIsBusy(true);
    deposit(amount).finally(() => {
      setIsBusy(false);
    });
  });

  return (
    <div>
      {depositModal.modalShown && (
        <DepositWarningModal
          ok={depositModal.onModalOK}
          cancel={depositModal.onModalClose}
        />
      )}
      <AmountInput
        className="mb-5"
        balance={solBalance}
        token="SOL"
        amount={amount}
        setAmount={setAmount}
        setValid={setValid}
        mode="STAKE"
      />
      <div className="flex items-center justify-start sm:justify-end">
        <Button onClick={depositModal.trigger} disabled={!valid || isBusy}>
          {isBusy ? <Spinner size="1rem" className="mr-1" /> : null}
          Deposit <FiArrowUpRight className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export { StakeForm };
