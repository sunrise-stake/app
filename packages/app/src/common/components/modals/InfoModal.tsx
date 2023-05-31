import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { type FC, type PropsWithChildren } from "react";

import { BaseModal } from "./";
import { type ModalControl } from "../../hooks";

const DefaultIcon: FC = () => (
  <ExclamationTriangleIcon className="w-8" aria-hidden="true" color="#f9c23c" />
);

type InfoModalProps = {
  title: string;
  message?: string;
  modalControl: ModalControl;
  icon?: JSX.Element;
  showActions?: boolean;
  ok?: () => void;
} & PropsWithChildren;
const InfoModal: FC<InfoModalProps> = ({
  icon = <DefaultIcon />,
  ...props
}) => (
  <BaseModal
    cancelVisible={false}
    {...props}
    ok={props.ok ?? props.modalControl.onModalOK}
    cancel={props.modalControl.onModalClose}
    show={props.modalControl.modalShown}
  >
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
      {icon}
    </div>
    <div className="text-center">
      <Dialog.Title
        as="h3"
        className="text-lg font-bold leading-6 text-green text-center"
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

export { InfoModal };
