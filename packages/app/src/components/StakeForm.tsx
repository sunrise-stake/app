import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft, FiArrowUpRight } from "react-icons/fi";
import clx from "classnames";

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
  const [isMax, setIsMax] = useState(false);

  return (
    <div className={className}>
      <div className="flex flex-row justify-between p-8 my-auto bg-background">
        <img src="solana-logo.png" className="h-24 my-auto" />
        <div className="my-auto">
          <div className="text-right">
            Balance:{" "}
            <span className="text-blue">
              {balance ? toFixedWithPrecision(toSol(balance)) : "-"} SOL
            </span>
          </div>
          <span className="flex flex-row mt-2">
            <button
              className={clx(
                "text-xl my-auto mx-4 px-4 py-1 border-solid border-[1px] border-green rounded-md bg-green",
                { "bg-opacity-25": !isMax }
              )}
              onClick={() => {
                setIsMax((prevState) => {
                  if (prevState) {
                    // setAmount here creates a warning but I don't understand why, it says this is a bad setState call
                    setAmount("0");
                  } else {
                    balance &&
                      setAmount(
                        toFixedWithPrecision(toSol(balance)).toString()
                      );
                  }
                  return !prevState;
                });
              }}
            >
              Max
            </button>

            <input
              className="w-28 border-none bg-transparent text-3xl text-right"
              type="number"
              min="0"
              // It still show comma instead of point for decimal
              lang="en"
              placeholder="0.00"
              value={amount}
              onChange={(ev) => {
                setAmount(ev.currentTarget.value);
                setIsMax(false);
              }}
            />
          </span>
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
