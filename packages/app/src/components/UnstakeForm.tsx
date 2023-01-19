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
  const [valid, setValid] = useState(false);
  const [feeLoading, setFeeLoading] = useState(true);

  const withdrawModal = useModal(() => withdraw(amount));

  useEffect(() => {
    if (client && details) setFeeLoading(false);
  }, [client, details]);

  const withdrawalFee = useMemo(() => {
    if (!client || !details || !amount) return 0;

    setFeeLoading(false);

    const lamports = solToLamports(amount);

    if (lamports.lte(ZERO)) return 0;
    const fee = client.calculateWithdrawalFee(lamports, details);

    const feeNumerator = fee.muln(100_000);

    console.log("fee ", fee.toString());

    return feeNumerator.div(lamports).toNumber() / 1000;
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
        setValid={setValid}
      />
      <div className="flex items-center justify-between">
        <UnstakeOption
          setDelayedWithdraw={setDelayedWithdraw}
          delayedWithdraw={delayedWithdraw}
          withdrawalFee={withdrawalFee}
          feeLoading={feeLoading}
        />
        <Button onClick={() => withdraw(amount)} disabled={!valid}>
          Withdraw <FiArrowDownLeft className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default UnstakeForm;
