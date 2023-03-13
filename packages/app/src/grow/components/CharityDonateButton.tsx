import React, { type FC } from "react";
import { type Charity } from "./types";
import { useModal } from "../../common/hooks";
import { SendGSolModal } from "../../common/components/modals/SendGSolModal";

export const CharityDonateButton: FC<{ charity: Charity }> = ({ charity }) => {
  const sendGSolModal = useModal(() => {});
  return (
    <button
      className="hover:cursor-pointer bg-cover bg-blend-multiply bg-center bg-no-repeat hover:scale-110 hover:brightness-105 hover:transition-all"
      style={
        charity.imageUrl !== undefined
          ? {
              backgroundImage: `url(${charity.imageUrl})`,
              backgroundColor: "grey",
            }
          : {}
      }
      onClick={sendGSolModal.trigger}
    >
      <SendGSolModal
        ok={sendGSolModal.onModalOK}
        cancel={sendGSolModal.onModalClose}
        show={sendGSolModal.modalShown}
        recipient={charity}
      />
      <div className="p-8 rounded-md w-40 h-30 text-white font-extrabold text-xl font-medium text-center">
        {charity.name}
      </div>
    </button>
  );
};
