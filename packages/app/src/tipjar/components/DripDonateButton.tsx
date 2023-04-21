import { type FC } from "react";

import { useModal } from "../../common/hooks";
import { SendGSolModal } from "../../common/components/modals/SendGSolModal";
import { Button } from "../../common/components";
import { type Artist } from "../../grow/types";
import { noop } from "../../common/utils";

export const DripDonateButton: FC<{
  artist: Artist;
  onDonate?: (receiver: Artist) => void;
}> = ({ artist, onDonate }) => {
  const sendGSolModal = useModal(noop);
  return (
    <>
      <SendGSolModal
        ok={sendGSolModal.onModalOK}
        cancel={sendGSolModal.onModalClose}
        show={sendGSolModal.modalShown}
        recipient={{ address: artist.wallet, name: artist.twitter }}
        onSend={() => {
          if (onDonate) onDonate(artist);
        }}
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
