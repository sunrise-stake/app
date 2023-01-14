import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft, FiArrowUpRight } from "react-icons/fi";

import DepositWarningModal from "./modals/DepositWarningModal";
import useModal from "../hooks/useModal";
import LiquidWithdrawWarningModal from "./modals/LiquidWithdrawWarningModal";
import { Button } from "./Button";
import { toFixedWithPrecision, toSol } from "../lib/util";

interface AmountInputProps {
  className?: string;
  balance: BN | undefined;
  setAmount: Function;
}

const AmountInput: React.FC<AmountInputProps> = ({
  balance,
  className,
  setAmount,
}) => (
  <div className={className}>
    <div className="p-8 pt-3 bg-background">
      <div className="text-right">
        Balance:{" "}
        <span className="text-blue">
          {balance ? toFixedWithPrecision(toSol(balance)) : "-"} SOL
        </span>
      </div>
      <input
        className="w-full border-none bg-transparent text-3xl text-right"
        type="number"
        placeholder="0.00"
        onChange={(ev) => setAmount(ev.currentTarget.value)}
      />
    </div>
  </div>
);

interface StakeFormProps {
  withdraw: (amount: string) => void;
  deposit: (amount: string) => void;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
  solBalance: BN | undefined;
}

const StakeForm: React.FC<StakeFormProps> = ({
  withdraw,
  deposit,
  setDelayedWithdraw,
  solBalance,
}) => {
  const [amount, setAmount] = useState("");

  const depositModal = useModal(() => deposit(amount));
  const withdrawModal = useModal(() => withdraw(amount));

  return (
    <div>
      {depositModal.modalShown && (
        <DepositWarningModal
          ok={depositModal.onModalOK}
          cancel={depositModal.onModalClose}
        />
      )}
      {withdrawModal.modalShown && (
        <LiquidWithdrawWarningModal
          ok={withdrawModal.onModalOK}
          cancel={withdrawModal.onModalClose}
        />
      )}
      <AmountInput
        className="mb-5"
        balance={solBalance}
        setAmount={setAmount}
      />
      <div className="flex items-center justify-end">
        <Button className="mr-5" onClick={depositModal.trigger}>
          Deposit <FiArrowUpRight className="inline" size={24} />
        </Button>
        <Button onClick={() => withdraw(amount)}>
          Withdraw <FiArrowDownLeft className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default StakeForm;
