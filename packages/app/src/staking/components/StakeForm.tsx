import type BN from "bn.js";
import React from "react";
import { IoWarningOutline } from "react-icons/io5";

interface StakeFormProps {
  deposit: (amount: string) => Promise<any>;
  solBalance: BN | undefined;
}

const StakeForm: React.FC<StakeFormProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <IoWarningOutline size={48} className="text-danger mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">
        Deposits Disabled
      </h2>
      <p className="text-gray-300 max-w-md">
        Sunrise is shutting down and deposits have been disabled. Please
        withdraw your existing SOL using the Unstake option above.
      </p>
    </div>
  );
};

export { StakeForm };
