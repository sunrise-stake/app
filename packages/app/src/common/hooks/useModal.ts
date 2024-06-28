import { useState } from "react";

export interface ModalControl {
  trigger: () => void;
  modalShown: boolean;
  onModalClose: () => void;
  onModalOK: () => void;
}

const useModal = (onOK: () => void, onCancel = () => {}): ModalControl => {
  const [modalShown, setModalShown] = useState(false);
  const trigger = (): void => {
    setModalShown(true);
  };
  const onModalClose = (): void => {
    setModalShown(false);
    onCancel();
  };
  const onModalOK = (): void => {
    setModalShown(false);
    onOK();
  };
  return {
    trigger,
    modalShown,
    onModalClose,
    onModalOK,
  };
};

export { useModal };
