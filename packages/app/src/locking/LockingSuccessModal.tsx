import { LockTweetButton } from "./LockTweetButton";
import { InfoModal } from "../common/components/modals/InfoModal";
import React, { type FC } from "react";
import { type ModalControl } from "../common/hooks";

export const LockingSuccessModal: FC<{
  control: ModalControl;
  amount: string;
}> = ({ control, amount }) => {
  return (
    <InfoModal title="Well done!" modalControl={control} showActions={false}>
      <LockTweetButton />
    </InfoModal>
  );
};
