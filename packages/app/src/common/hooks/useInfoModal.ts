import { type ModalControl, useModal } from "./useModal";

// An info modal is a modal that only has an OK button and has a neutral event by default
const useInfoModal = (onOK = () => {}): ModalControl => useModal(onOK);

export { useInfoModal };
