import React, { type FC, useState } from "react";
import { type Charity } from "../types";
import { useModal } from "../../common/hooks";
import { SendGSolModal } from "../../common/components/modals/SendGSolModal";
import { OrgButtonContent } from "../OrgButtonContent";
import { InfoModal } from "../../common/components/modals/InfoModal";
import { useInfoModal } from "../../common/hooks/useInfoModal";
import { ZERO } from "../../common/utils";
import BN from "bn.js";
import { MangroveFormButton } from "../../rewards/components/MangroveFormButton";

const DONATION_REWARD_AMOUNT = new BN("50000000"); // lamports

export const CharityDonateButton: FC<{ charity: Charity }> = ({ charity }) => {
  const sendGSolModal = useModal(() => {});
  const [donatedAmount, setDonatedAmount] = useState(ZERO); // lamports
  const donationInfoModal = useInfoModal();

  return (
    <>
      <InfoModal
        title="Well done!"
        modalControl={donationInfoModal}
        showActions={false}
      >
        <p className="text-md">You have donated to {charity.name}!</p>
        {donatedAmount.gte(DONATION_REWARD_AMOUNT) && <MangroveFormButton />}
      </InfoModal>
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
        onSend={(details) => {
          setDonatedAmount(details.amount);
          donationInfoModal.trigger();
        }}
      />
    </>
  );
};
