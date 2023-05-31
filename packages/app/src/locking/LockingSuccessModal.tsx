import { MangroveFormButton } from "../rewards/components/MangroveFormButton";
import { LockTweetButton } from "./LockTweetButton";
import { InfoModal } from "../common/components/modals/InfoModal";
import React, { type FC } from "react";
import { type ModalControl } from "../common/hooks";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";
import { solToLamports } from "../common/utils";

const LOCK_REWARD_AMOUNT = new BN(0.5 * LAMPORTS_PER_SOL); // 0.5 SOL in lamports

export const LockingSuccessModal: FC<{
  control: ModalControl;
  amount: string;
}> = ({ control, amount }) => {
  const eligibleForReward = solToLamports(amount).gte(LOCK_REWARD_AMOUNT);
  return (
    <InfoModal title="Well done!" modalControl={control} showActions={false}>
      {eligibleForReward && <MangroveFormButton />}
      <LockTweetButton />
    </InfoModal>
  );
};
