import BN from "bn.js";
import React, { useEffect, useMemo, useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import useModal from "../hooks/useModal";
import LiquidWithdrawWarningModal from "./modals/LiquidWithdrawWarningModal";
import { Button } from "./Button";
import AmountInput from "./AmountInput";
import UnstakeOption from "./UnstakeOption";
import { useSunriseStake } from "../context/sunriseStakeContext";
import { solToLamports, ZERO } from "../lib/util";

interface UnstakeFormProps {
  withdraw: (amount: string) => void;
  delayedWithdraw: boolean;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
}

const UnstakeForm: React.FC<UnstakeFormProps> = ({
  withdraw,
  delayedWithdraw,
  setDelayedWithdraw,
}) => {
  const { client, details } = useSunriseStake();
  const [amount, setAmount] = useState("");
  const [feeLoading, setFeeLoading] = useState(true);

  const withdrawModal = useModal(() => withdraw(amount));

  useEffect(() => {
    if (client && details) setFeeLoading(false);
  }, [client, details]);

  const withdrawalFee = useMemo(() => {
    if (!client || !details) return new BN(0);

    setFeeLoading(false);

    if (!amount) return ZERO;

    return client.calculateWithdrawalFee(solToLamports(amount), details);
  }, [client, details, amount]);

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
        balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
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
