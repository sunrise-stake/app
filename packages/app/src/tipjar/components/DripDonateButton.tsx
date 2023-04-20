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
      />
      <Button onClick={sendGSolModal.trigger}>Tip the artist</Button>
    </>
  );
};
