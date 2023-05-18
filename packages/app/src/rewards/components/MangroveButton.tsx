import { Button } from "../../common/components";
import { useInfoModal } from "../../common/hooks/useInfoModal";
import { MangroveModal } from "./MangroveModal";
import React, { type FC } from "react";

export const MangroveButton: FC = () => {
  const infoModal = useInfoModal();
  return (
    <div className="mt-6 mb-4">
      <MangroveModal control={infoModal} />
      <Button color="primary" variant="outline" onClick={infoModal.trigger}>
        <img
          src="partners/panasea.png"
          alt="Mangrove Reward"
          className="w-8 h-8 mr-2"
        />
        Mangrove Rewards
      </Button>
    </div>
  );
};
