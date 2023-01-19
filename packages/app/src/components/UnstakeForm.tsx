import BN from "bn.js";
import React, { useMemo, useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import useModal from "../hooks/useModal";
import LiquidWithdrawWarningModal from "./modals/LiquidWithdrawWarningModal";
import { Button } from "./Button";
import AmountInput from "./AmountInput";
import UnstakeOption from "./UnstakeOption";

interface UnstakeFormProps {
  withdraw: (amount: string) => void;
  delayedWithdraw: boolean;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
  gSolBalance: BN | undefined;
  calculateFee?: (amount: BN) => Promise<BN>;
}

const UnstakeForm: React.FC<UnstakeFormProps> = ({
  withdraw,
  delayedWithdraw,
  setDelayedWithdraw,
  calculateFee,
  gSolBalance,
}) => {
  const [amount, setAmount] = useState("");
  const [feeLoading, setFeeLoading] = useState(false);

  const withdrawModal = useModal(() => withdraw(amount));

  const withdrawalFee = useMemo(() => {
    if (!amount || !calculateFee) return new BN(0);

    // Use a rounded up value because BN can not handle decimals.
    // Calculated fee is possible higher than actual fee
    const roundedUp = Math.ceil(Number(amount));
    setFeeLoading(true);

    return calculateFee(new BN(roundedUp)).finally(() => setFeeLoading(false));
  }, [calculateFee, amount]);

  return (
    <div>
      {withdrawModal.modalShown && (
        <LiquidWithdrawWarningModal
          ok={withdrawModal.onModalOK}
          cancel={withdrawModal.onModalClose}
        />
      )}

      <AmountInput
        className="mb-5"
        token="gSOL"
        balance={gSolBalance}
        amount={amount}
        setAmount={setAmount}
      />
      <div className="flex items-center justify-between">
        <UnstakeOption
          setDelayedWithdraw={setDelayedWithdraw}
          delayedWithdraw={delayedWithdraw}
          withdrawalFee={withdrawalFee}
          feeLoading={feeLoading}
        />
        <Button onClick={() => withdraw(amount)}>
          Withdraw <FiArrowDownLeft className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default UnstakeForm;
