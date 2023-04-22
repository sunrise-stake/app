import clx from "classnames";
import { MAX_NUM_PRECISION, toSol } from "@sunrisestake/client";
import type BN from "bn.js";
import React from "react";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";

import {
  getDigits,
  lamportsToDisplay,
  solToLamports,
  toFixedWithPrecision,
  type UIMode,
  ZERO,
} from "../utils";
import { tooltips } from "../content/tooltips";
import { TooltipPopover } from "./TooltipPopover";

interface AmountInputProps {
  className?: string;
  token?: "SOL" | "gSOL";
  balance: BN | undefined;
  showBalance?: boolean;
  amount: string;
  setAmount: (amountStr: string) => void;
  setValid: (valid: boolean) => void;
  mode: UIMode;
  variant?: "small" | "large";
}

const AmountInput: React.FC<AmountInputProps> = ({
  balance,
  showBalance = true,
  className,
  amount,
  setAmount,
  token = "SOL",
  setValid,
  mode,
  variant = "large",
}) => {
  const handleIncDecBtnClick = (op: "INC" | "DEC"): void => {
    const parsedAmount = parseFloat(amount);
    let newAmount;

    if (!amount && op === "INC") newAmount = "1";
    else if (
      (op === "DEC" && !amount) ||
      (op === "DEC" && parsedAmount - 1 <= 0)
    )
      newAmount = "0";
    else {
      newAmount = String(op === "INC" ? parsedAmount + 1 : parsedAmount - 1);
    }

    if (getDigits(newAmount) !== getDigits(amount))
      newAmount = "" + parseFloat(newAmount).toFixed(getDigits(amount));

    updateAmount(newAmount);
  };

  const getMaxBalance = (): BN => {
    if (balance === undefined) return ZERO;

    if (mode === "STAKE") {
      // ensure that the user has enough SOL remaining to pay for the transaction fee and rent
      const maxStakeableBalance = balance.sub(solToLamports("0.005"));
      return maxStakeableBalance.lt(ZERO) ? ZERO : maxStakeableBalance;
    }

    return balance;
  };

  const updateAmount = (amountStr: string): void => {
    const parsedValue = solToLamports(amountStr);
    const min = ZERO;
    const max = getMaxBalance();

    setAmount(amountStr);
    setValid(parsedValue.gt(min) && parsedValue.lte(max));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    updateAmount(value);
  };

  return (
    <div className={className}>
      <div
        className={clx(
          "flex flex-row justify-between my-auto py-2 bg-background rounded-md text-green",
          {
            "p-8": variant === "large",
            "px-2": variant === "small",
          }
        )}
      >
        <div className="grow my-auto">
          {showBalance && (
            <div className="flex items-center justify-end">
              Balance:{" "}
              <button
                className="px-2 py-1 rounded-md hover:bg-green-light text-green-light hover:text-white font-bold"
                onClick={() => {
                  if (balance) {
                    updateAmount(
                      lamportsToDisplay(getMaxBalance(), MAX_NUM_PRECISION)
                    );
                  }
                }}
              >
                {balance ? lamportsToDisplay(balance) : "-"} {token}
              </button>
              {(mode === "UNSTAKE" || mode === "LOCK") && (
                <TooltipPopover>{tooltips.unstakeBalance}</TooltipPopover>
              )}
            </div>
          )}
          <div className="flex">
            {variant === "large" && (
              <img
                src={`${token}.png`}
                className="h-12 my-auto pr-2"
                alt="token"
              />
            )}
            <input
              className={clx(
                "appearance-textfield grow w-full border-none bg-transparent",
                {
                  "text-right text-2xl": variant === "large",
                  "text-left text-lg": variant === "small",
                }
              )}
              type="number"
              min="0"
              max={balance ? toFixedWithPrecision(toSol(getMaxBalance())) : "0"}
              placeholder="0.00"
              value={amount}
              onChange={handleChange}
            />
            <div>
              <button
                className="block"
                onClick={() => {
                  handleIncDecBtnClick("INC");
                }}
              >
                <MdArrowDropUp className="text-green-light" size={28} />
              </button>
              <button
                className="block"
                onClick={() => {
                  handleIncDecBtnClick("DEC");
                }}
              >
                <MdArrowDropDown className="text-green-light" size={28} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AmountInput };
