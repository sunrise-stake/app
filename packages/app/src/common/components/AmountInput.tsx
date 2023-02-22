import BN from "bn.js";
import React, { useCallback } from "react";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";

import {
  getDigits,
  solToLamports,
  toFixedWithPrecision,
  toSol,
  type UIMode,
} from "../utils";

interface AmountInputProps {
  className?: string;
  token?: string;
  balance: BN | undefined;
  amount: string;
  setAmount: (amountStr: string) => void;
  setValid: (valid: boolean) => void;
  mode: UIMode;
}

const AmountInput: React.FC<AmountInputProps> = ({
  balance,
  className,
  amount,
  setAmount,
  token = "SOL",
  setValid,
  mode,
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

  const updateAmount = useCallback(
    (amountStr: string) => {
      const parsedValue = solToLamports(amountStr);
      const min = solToLamports(0);
      const max = balance ?? new BN(0);

      console.log("parsedValue ", parsedValue.toString());
      console.log("minValue ", min.toString());
      console.log("maxValue ", max.toString());

      setAmount(amountStr);
      console.log(`Min: ${min.toNumber()}`);
      console.log(`Max: ${max.toNumber()}`);
      console.log(
        `Valid: ${
          parsedValue.gt(min) && parsedValue.lte(max) ? "true" : "false"
        }`
      );
      setValid(parsedValue.gt(min) && parsedValue.lte(max));
    },
    [setValid, balance]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    updateAmount(value);
  };

  return (
    <div className={className}>
      <div className="flex flex-row justify-between p-8 my-auto bg-background">
        <div className="grow my-auto">
          <div className="text-right">
            Balance:{" "}
            <button
              className="text-blue hover:bg-outset hover:cursor-pointer py-1 px-2 rounded-md"
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
          <div className="flex">
            <img
              src={`${token}.png`}
              className="h-12 my-auto pr-2"
              alt="token"
            />
            <input
              className="appearance-textfield grow w-full border-none bg-transparent text-3xl text-right"
              type="number"
              min="0"
              max={balance ? toFixedWithPrecision(toSol(balance)) : "0"}
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
