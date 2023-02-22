import BN from "bn.js";
import React, { useEffect, useMemo, useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import useModal from "../hooks/useModal";
import LiquidWithdrawWarningModal from "./modals/LiquidWithdrawWarningModal";
import { Button } from "./Button";
import AmountInput from "./AmountInput";
import UnstakeOption from "./UnstakeOption";
import { useSunriseStake } from "../context/sunriseStakeContext";
import { solToLamports, ZERO } from "../utils";
import Spinner from "./Spinner";

interface UnstakeFormProps {
  withdraw: (amount: string) => Promise<any>;
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
  const [isBusy, setIsBusy] = useState(false);

  const withdrawModal = useModal(() => {
    setIsBusy(true);
    withdraw(amount).finally(() => {
      setIsBusy(false);
    });
  });

  useEffect(() => {
    if (client != null && details != null) setFeeLoading(false);
  }, [client, details]);

  const withdrawalFee = useMemo(() => {
    if (client == null || details == null || amount == null) return 0;

    setFeeLoading(false);

    const lamports = solToLamports(amount);

    if (lamports.lte(ZERO)) return 0;
    const withdrawalFees = client.calculateWithdrawalFee(lamports, details);

    const feeNumerator = withdrawalFees.totalFee.muln(100_000);

    console.log("fee ", withdrawalFees.totalFee.toString());

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
        mode="UNSTAKE"
      />
      <div className="flex flex-col-reverse gap-4 sm:flex-row justify-between">
        <UnstakeOption
          setDelayedWithdraw={setDelayedWithdraw}
          delayedWithdraw={delayedWithdraw}
          withdrawalFee={withdrawalFee}
          feeLoading={feeLoading}
        />
        <Button
          onClick={() => {
            setIsBusy(true);
            withdraw(amount).finally(() => {
              setIsBusy(false);
            });
          }}
          disabled={!valid || isBusy}
          className="mr-auto sm:mr-0"
        >
          {isBusy ? <Spinner size="1rem" className="mr-1" /> : null}
          Withdraw <FiArrowDownLeft className="inline" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default UnstakeForm;
