import React from "react";
import BN from "bn.js";
import { toFixedWithPrecision, toSol } from "../lib/util";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";

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
  const handleIncDecBtnClick = (op: "INC" | "DEC"): void => {
    const parsedAmount = parseFloat(amount);
    if (!amount && op === "INC") setAmount("1");
    else if ((!amount && op === "DEC") || (parsedAmount <= 0 && op === "DEC"))
      setAmount("0");
    else {
      setAmount(op === "INC" ? parsedAmount + 1 : parsedAmount - 1);
    }
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
                  setAmount(toFixedWithPrecision(toSol(balance)).toString());
                }
              }}
            >
              {balance ? toFixedWithPrecision(toSol(balance)) : "-"} {token}
            </button>
          </div>
          <div className="flex">
            <img src={`${token}.png`} className="h-12 my-auto pr-2" />
            <input
              className="appearance-textfield grow w-full border-none bg-transparent text-3xl text-right"
              type="number"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(ev) => {
                setAmount(ev.currentTarget.value);
              }}
            />
            <div>
              <button
                className="block"
                onClick={() => handleIncDecBtnClick("INC")}
              >
                <MdArrowDropUp className="text-green-light" size={28} />
              </button>
              <button
                className="block"
                onClick={() => handleIncDecBtnClick("DEC")}
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

export default AmountInput;
