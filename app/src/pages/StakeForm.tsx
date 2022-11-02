import React, { FormEvent } from "react";

interface StakeFormProps {
  withdraw: (e: FormEvent) => void;
  deposit: (e: FormEvent) => void;
}
const StakeForm: React.FC<StakeFormProps> = ({ withdraw, deposit }) => {
  return (
    <>
      <form onSubmit={deposit} className="w-full grid grid-cols-3 gap-2">
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          className="input input-bordered input-primary max-w-xs rounded-md col-span-2"
        />
        <button
          type="submit"
          className="inline-block px-6 py-2 border-2 w-full rounded-md border-green-600 text-green-600 font-medium text-xs leading-tight uppercase hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
        >
          deposit
        </button>
      </form>
      <form onSubmit={withdraw} className="w-full grid grid-cols-3 gap-2">
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          className="input input-bordered input-primary max-w-xs rounded-md col-span-2"
        />
        <button
          type="submit"
          className="inline-block border-2 rounded-md border-green-600 text-green-600 font-medium text-xs leading-tight uppercase hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
        >
          withdraw
        </button>
      </form>
    </>
  );
};

export default StakeForm;
