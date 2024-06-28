import { type ModalControl, useModal } from "./useModal";

// An info modal is a modal that only has an OK button and has a neutral event by default
// OnCancel is called only if the user clicks outside the modal
const useInfoModal = (onOK = () => {}, onCancel = () => {}): ModalControl =>
  useModal(onOK, onCancel);

export { useInfoModal };
