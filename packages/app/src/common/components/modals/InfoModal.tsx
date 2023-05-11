import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { type FC, type PropsWithChildren } from "react";

import { BaseModal } from "./";
import { type ModalControl } from "../../hooks";

type InfoModalProps = {
  title: string;
  message?: string;
  modalControl: ModalControl;
} & PropsWithChildren;
const InfoModal: FC<InfoModalProps> = (props) => {
  return (
    <BaseModal
      cancelVisible={false}
      {...props}
      ok={props.modalControl.onModalOK}
      cancel={props.modalControl.onModalClose}
      show={props.modalControl.modalShown}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <ExclamationTriangleIcon
          className="w-8"
          aria-hidden="true"
          color="#f9c23c"
        />
      </div>
      <div className="text-center">
        <Dialog.Title
          as="h3"
          className="text-md font-bold leading-6 text-[#f9c23c] text-center"
        >
          {props.title}
        </Dialog.Title>
        <div className="mt-2">
          <div className="flex flex-col gap-1 py-6 px-2">
            {props.message !== undefined && (
              <p className="text-md">{props.message}</p>
            )}
            {props.children}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export { InfoModal };
