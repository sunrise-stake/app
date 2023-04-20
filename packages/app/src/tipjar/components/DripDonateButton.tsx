import { type FC } from "react";

import { useModal } from "../../common/hooks";
import { SendGSolModal } from "../../common/components/modals/SendGSolModal";
import { Button } from "../../common/components";
import { type Charity } from "../../grow/components/types";

export const DripDonateButton: FC<{ charity: Charity }> = ({ charity }) => {
  const sendGSolModal = useModal(() => {});
  return (
    <>
      <SendGSolModal
        ok={sendGSolModal.onModalOK}
        cancel={sendGSolModal.onModalClose}
        show={sendGSolModal.modalShown}
        recipient={charity}
      >
        <div className="hidden sm:block">
          <div className="mb-4 text-2xl text-center">
            Recognition for those who deserve it
          </div>
          <p className="mb-4">
            Drop some SOL in your favourite artist&apos;s wallet. DRiP is all
            about free art, so there&apos;s no obligation. Every lamport is
            appreciated!
          </p>
        </div>
      </SendGSolModal>
      <Button onClick={sendGSolModal.trigger}>Tip the artist</Button>
    </>
  );
};
