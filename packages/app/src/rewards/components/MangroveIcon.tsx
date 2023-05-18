import { AttentionIcon } from "../../common/components/AttentionIcon";
import React, { type FC } from "react";
import { useInfoModal } from "../../common/hooks/useInfoModal";
import { MangroveModal } from "./MangroveModal";

export const MangroveIcon: FC = () => {
  const infoModal = useInfoModal();
  return (
    <>
      <MangroveModal control={infoModal} />
      <AttentionIcon
        imgUrl="partners/panasea.png"
        alt="Mangrove Reward"
        onClick={(e) => {
          infoModal.trigger();
          e.preventDefault();
        }}
      />
    </>
  );
};
