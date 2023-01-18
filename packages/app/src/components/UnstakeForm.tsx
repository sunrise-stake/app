import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import useModal from "../hooks/useModal";
import LiquidWithdrawWarningModal from "./modals/LiquidWithdrawWarningModal";
import { Button } from "./Button";
import AmountInput from "./AmountInput";
import UnstakeOption from "./UnstakeOption";

interface UnstakeFormProps {
  withdraw: (amount: string) => void;
  delayedWithdraw: boolean;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
  gSolBalance: BN | undefined;
}

const UnstakeForm: React.FC<UnstakeFormProps> = ({
  withdraw,
  delayedWithdraw,
  setDelayedWithdraw,
  gSolBalance,
}) => {
  const [amount, setAmount] = useState("");

  const withdrawModal = useModal(() => withdraw(amount));

  return (
    <div>
      {withdrawModal.modalShown && (
        <LiquidWithdrawWarningModal
          ok={withdrawModal.onModalOK}
          cancel={withdrawModal.onModalClose}
        />
      )}

      <AmountInput
        className="mb-5"
        token="gSOL"
        balance={gSolBalance}
        amount={amount}
        setAmount={setAmount}
      />
      <div className="flex items-center justify-between">
        <UnstakeOption
          setDelayedWithdraw={setDelayedWithdraw}
          delayedWithdraw={delayedWithdraw}
        />
        <Button onClick={() => withdraw(amount)}>
          Withdraw <FiArrowDownLeft className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default UnstakeForm;
