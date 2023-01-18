import React from "react";
import BN from "bn.js";
import { toFixedWithPrecision, toSol } from "../lib/util";

interface AmountInputProps {
  className?: string;
  token?: string;
  balance: BN | undefined;
  amount: string;
  setAmount: Function;
}

const AmountInput: React.FC<AmountInputProps> = ({
  balance,
  className,
  amount,
  setAmount,
  token = "SOL",
}) => {
  return (
    <div className={className}>
      <div className="flex flex-row justify-between p-8 my-auto bg-background">
        <img src={`${token}.png`} className="h-12 my-auto" />
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

export default AmountInput;
