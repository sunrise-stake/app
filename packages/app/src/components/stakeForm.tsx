import React, { useRef } from "react";

interface StakeFormProps {
  withdraw: (amount: string) => void;
  deposit: (amount: string) => void;
}

const StakeForm: React.FC<StakeFormProps> = ({ withdraw, deposit }) => {
  const amount = useRef<HTMLInputElement>(null);
  return (
    <div className="w-96 flex flex-col items-center justify-center align-center">
      <h2 className="text-2xl text-center text-[#A4C0AF]">
        How much do you want to stake?
      </h2>
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        ref={amount}
        className="input input-bordered text-center py-3 mt-3 rounded-md w-full bg-neutral-800 text-1xl text-[#A4C0AF]"
      />
      <button
        type="submit"
        className="w-full inline-block py-3 mt-3 bg-[#7BB692] text-slate-800 font-medium text-xl leading-snug uppercase rounded-md shadow-md hover:bg-blue-sunrise hover:shadow-lg focus:bg-[#5A9370] focus:shadow-lg focus:outline-none focus:ring-0 active:bg-[#5A9370] active:shadow-lg transition duration-150 ease-in-out"
        onClick={() => deposit(amount.current?.value ?? "")}
      >
        deposit
      </button>
      <h2 className="text-2xl text-[#A4C0AF] text-center py-3 ">or</h2>
      <button
        type="submit"
        className="inline-block py-3 px-20 mt-3 border-2 w-full rounded-md border-[#7BB692] text-[#7BB692] font-medium text-xl leading-tight uppercase hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out active:bg-[#5A9370] active:text-slate-800"
        onClick={() => withdraw(amount.current?.value ?? "")}
      >
        withdraw
      </button>
    </div>
  );
};

export default StakeForm;
