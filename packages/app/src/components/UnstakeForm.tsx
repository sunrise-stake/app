import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import useModal from "../hooks/useModal";
import LiquidWithdrawWarningModal from "./modals/LiquidWithdrawWarningModal";
import { Button } from "./Button";
import AmountInput from "./AmountInput";

interface UnstakeFormProps {
  withdraw: (amount: string) => void;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
  solBalance: BN | undefined;
}

const UnstakeForm: React.FC<UnstakeFormProps> = ({
  withdraw,
  setDelayedWithdraw,
  solBalance,
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
        balance={solBalance}
        amount={amount}
        setAmount={setAmount}
      />
      <div className="flex items-center justify-end">
        <Button onClick={() => withdraw(amount)}>
          Withdraw <FiArrowDownLeft className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default UnstakeForm;
