import BN from "bn.js";
import React, { useState } from "react";
import { FiArrowDownLeft } from "react-icons/fi";

import { useSunriseStake } from "../context/sunriseStakeContext";
import { solToLamports, ZERO } from "../utils";
import { AmountInput, Button, Panel, Spinner } from "./";
import { useModal } from "../hooks";
import { LockWarningModal } from "./modals/LockWarningModal";
import { useInfoModal } from "../hooks/useInfoModal";
import { MangroveFormButton } from "../../rewards/components/MangroveFormButton";
import { InfoModal } from "./modals/InfoModal";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const LOCK_REWARD_AMOUNT = new BN(LAMPORTS_PER_SOL); // 1 SOL in lamports

interface LockFormProps {
  lock: (amount: string) => Promise<any>;
}
const LockForm: React.FC<LockFormProps> = ({ lock }) => {
  const { details } = useSunriseStake();
  const [amount, setAmount] = useState("");
  const [valid, setValid] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const lockModal = useModal(() => {
    setIsBusy(true);
    lock(amount)
      .then(() => {
        if (solToLamports(amount).gte(LOCK_REWARD_AMOUNT)) {
          lockRewardModal.trigger();
        }
      })
      .finally(() => {
        setIsBusy(false);
      });
  });
  const lockRewardModal = useInfoModal();

  return (
    <Panel className="flex flex-row mx-auto mb-9 p-3 sm:p-4 rounded-lg w-full sm:w-[80%] md:w-[60%] lg:w-[40%] max-w-xl">
      <LockWarningModal
        ok={lockModal.onModalOK}
        cancel={lockModal.onModalClose}
        show={lockModal.modalShown}
      />
      <InfoModal
        title="Well done!"
        modalControl={lockRewardModal}
        showActions={false}
      >
        <MangroveFormButton />
      </InfoModal>
      <AmountInput
        className="mr-4 basis-3/4"
        token="gSOL"
        balance={new BN(details?.balances.gsolBalance.amount ?? ZERO)}
        amount={amount}
        setAmount={setAmount}
        setValid={setValid}
        mode="LOCK"
        variant="small"
      />
      <Button
        onClick={lockModal.trigger}
        disabled={!valid || isBusy}
        className="mr-auto sm:mr-0 m-auto"
        size="sm"
      >
        {isBusy ? <Spinner size="1rem" className="mr-1" /> : null}
        Lock <FiArrowDownLeft className="inline" size={24} />
      </Button>
    </Panel>
  );
};

export { LockForm };
