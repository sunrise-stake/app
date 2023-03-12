import clx from "classnames";
import { toSol } from "@sunrisestake/client";
import type BN from "bn.js";
import React from "react";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";

import {
  getDigits,
  solToLamports,
  toFixedWithPrecision,
  type UIMode,
  ZERO,
} from "../utils";

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

    console.log("parsedValue ", parsedValue.toString());

    setAmount(amountStr);
    console.log(`Min: ${min.toNumber()}`);
    console.log(`Max: ${max.toNumber()}`);
    console.log(
      `Valid: ${parsedValue.gt(min) && parsedValue.lte(max) ? "true" : "false"}`
    );
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
          "flex flex-row justify-between my-auto bg-background rounded-md",
          {
            "p-8": variant === "large",
            "px-2": variant === "small",
          }
        )}
      >
        <div className="grow my-auto">
          {showBalance && (
            <div className="text-right">
              Balance:{" "}
              <button
                className="px-2 py-1 rounded-md hover:bg-green text-green hover:text-white"
                onClick={() => {
                  if (balance) {
                    updateAmount(
                      toFixedWithPrecision(
                        mode === "STAKE" ? toSol(balance) - 0.1 : toSol(balance)
                      ).toString()
                    );
                  }
                }}
              >
                {balance ? toFixedWithPrecision(toSol(balance)) : "-"} {token}
              </button>
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
                  "text-right text-3xl": variant === "large",
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
            <button
              className="text-green font-semibold bg-green border border-green bg-opacity-20 hover:bg-opacity-50 hover:cursor-pointer m-auto py-2 px-3 rounded-md"
              onClick={() => {
                if (balance) {
                  updateAmount(toSol(getMaxBalance()).toString());
                }
              }}
            >
              MAX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AmountInput };
