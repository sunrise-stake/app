import React, { type FC } from "react";
import { type Charity } from "./types";
import { useModal } from "../../common/hooks";
import { SendGSolModal } from "../../common/components/modals/SendGSolModal";
import { OrgButtonContent } from "../OrgButtonContent";

export const CharityDonateButton: FC<{ charity: Charity }> = ({ charity }) => {
  const sendGSolModal = useModal(() => {});
  return (
    <>
      <button
        className="transition-all cursor-pointer bg-cover bg-blend-multiply bg-center bg-no-repeat hover:scale-105 hover:brightness-105"
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
        <OrgButtonContent>{charity.name}</OrgButtonContent>
      </button>
      <SendGSolModal
        ok={sendGSolModal.onModalOK}
        cancel={sendGSolModal.onModalClose}
        show={sendGSolModal.modalShown}
        recipient={charity}
      />
    </>
  );
};
