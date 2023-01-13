import React, { useState } from "react";
import DepositWarningModal from "./modals/DepositWarningModal";
import useModal from "../hooks/useModal";
import LiquidWithdrawWarningModal from "./modals/LiquidWithdrawWarningModal";
import { Button } from "./Button";
import BN from "bn.js";
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
    <div className="bg-background">
      <input
        className="bg-transparent text-3xl text-right"
        type="number"
        placeholder="0.00"
        onChange={(ev) => setAmount(ev.currentTarget.value)}
      />
    </div>
    <div className="px-7 py-3 border-2 border-transparent border-b-green-bright rounded-b bg-outset">
      <>Balance: {balance ? toFixedWithPrecision(toSol(balance)) : "-"} SOL</>
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
      <div className="flex items-center">
        <div className="grow">
          <Button className="mr-5" onClick={depositModal.trigger}>
            Deposit
          </Button>
          <Button
            variant="secondary"
            className="mr-5"
            onClick={() => withdraw(amount)}
          >
            Withdraw
          </Button>
        </div>
        <label>
          <input
            type="checkbox"
            onChange={(e) => setDelayedWithdraw(e.target.checked)}
          />
          Delayed
        </label>
      </div>
    </div>
  );
};

export default StakeForm;
