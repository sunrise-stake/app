import React, { useRef } from "react";
import DepositWarningModal from "./modals/DepositWarningModal";
import useModal from "../hooks/useModal";

interface StakeFormProps {
  withdraw: (amount: string) => void;
  deposit: (amount: string) => void;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
}

const StakeForm: React.FC<StakeFormProps> = ({
  withdraw,
  deposit,
  setDelayedWithdraw,
}) => {
  const depositModal = useModal(() => deposit(amount.current?.value ?? ""));

  const amount = useRef<HTMLInputElement>(null);
  return (
    <div className="w-96 flex flex-col items-center justify-center align-center">
      {depositModal.modalShown && (
        <DepositWarningModal
          ok={depositModal.onModalOK}
          cancel={depositModal.onModalClose}
        />
      )}
      <h2 className="text-2xl text-center text-primary-500">
        How much do you want to stake?
      </h2>
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        ref={amount}
        className="input input-bordered text-center py-3 mt-3 rounded-md w-full bg-neutral-800 text-1xl text-green"
      />
      <button
        type="submit"
        className="w-full inline-block py-3 mt-3 bg-[#7BB692] text-slate-800 font-medium text-xl leading-snug uppercase rounded-md shadow-md hover:bg-blue-sunrise hover:shadow-lg focus:bg-[#5A9370] focus:shadow-lg focus:outline-none focus:ring-0 active:bg-[#5A9370] active:shadow-lg transition duration-150 ease-in-out"
        onClick={depositModal.trigger}
      >
        deposit
      </button>
      <h2 className="text-2xl text-green text-center py-3 ">or</h2>
      <button
        type="submit"
        className="inline-block py-3 px-20 mt-3 border-2 w-full rounded-md border-[#7BB692] text-[#7BB692] font-medium text-xl leading-tight uppercase hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out active:bg-[#5A9370] active:text-slate-800"
        onClick={() => withdraw(amount.current?.value ?? "")}
      >
        withdraw
      </button>
      <div className="flex flex-row items-center justify-center mt-3">
        <input
          type="checkbox"
          name="delayedWithdraw"
          className="form-checkbox h-5 w-5 text-green"
          onChange={(e) => setDelayedWithdraw(e.target.checked)}
        />
        <label className="ml-2 text-green">Delayed Withdraw</label>
      </div>
    </div>
  );
};

export default StakeForm;
