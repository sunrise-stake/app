import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";

import DepositWarningModal from "./modals/DepositWarningModal";
import useModal from "../hooks/useModal";
import { Button } from "./Button";
import AmountInput from "./AmountInput";

interface StakeFormProps {
  deposit: (amount: string) => void;
  solBalance: BN | undefined;
}

const StakeForm: React.FC<StakeFormProps> = ({ deposit, solBalance }) => {
  const [amount, setAmount] = useState("");

  const depositModal = useModal(() => deposit(amount));

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
        amount={amount}
        setAmount={setAmount}
      />
      <div className="flex items-center justify-end">
        <Button className="mr-5" onClick={depositModal.trigger}>
          Deposit <FiArrowUpRight className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default StakeForm;
