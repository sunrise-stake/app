import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { type FC } from "react";

import { BaseModal, type ModalProps } from "./";
import { MangroveButton } from "../../../rewards/components/MangroveButton";

const LockWarningModal: FC<ModalProps> = (props) => {
  return (
    <BaseModal {...props}>
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
          Lock gSOL
        </Dialog.Title>
        <div className="mt-2">
          <div className="flex flex-col gap-1 py-6 px-2">
            <p className="text-md">
              Locked gSOL will be available to unlock after one full epoch (2-3
              days).
            </p>
            <MangroveButton />
            <p className="text-md">
              To earn a bonus Mangrove NFT, you must lock at least 0.5 gSOL.
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export { LockWarningModal };
