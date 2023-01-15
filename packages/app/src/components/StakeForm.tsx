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
  amount: string;
  setAmount: Function;
}

const AmountInput: React.FC<AmountInputProps> = ({
  balance,
  className,
  amount,
  setAmount,
}) => {
  return (
    <div className={className}>
      <div className="flex flex-row justify-between p-8 my-auto bg-background">
        <img src="solana-logo.png" className="h-24 my-auto" />
        <div className="my-auto">
          <div className="text-right">
            Balance:{" "}
            <span
              className="text-blue hover:bg-outset hover:cursor-pointer py-1 px-2 rounded-md"
              onClick={() => {
                if (balance) {
                  setAmount(toFixedWithPrecision(toSol(balance)).toString());
                }
              }}
            >
              {balance ? toFixedWithPrecision(toSol(balance)) : "-"} SOL
            </span>
          </div>
          <input
            className="w-full border-none bg-transparent text-3xl text-right"
            type="number"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(ev) => {
              setAmount(ev.currentTarget.value);
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface StakeFormProps {
  withdraw: (amount: string) => void;
  deposit: (amount: string) => void;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
  solBalance: BN | undefined;
  isStakeSelected: boolean;
}

const StakeForm: React.FC<StakeFormProps> = ({
  withdraw,
  deposit,
  setDelayedWithdraw,
  solBalance,
  isStakeSelected,
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
        amount={amount}
        setAmount={setAmount}
      />
      <div className="flex items-center justify-end">
        {isStakeSelected ? (
          <Button className="mr-5" onClick={depositModal.trigger}>
            Deposit <FiArrowUpRight className="inline" size={24} />
          </Button>
        ) : (
          <Button onClick={() => withdraw(amount)}>
            Withdraw <FiArrowDownLeft className="inline" size={24} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StakeForm;
