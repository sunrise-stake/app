import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { type FC } from "react";

import { useFlags } from "../../hooks";
import { BaseModal, type ModalProps, WarningConfirm } from "./";

const DepositWarningModal: FC<ModalProps> = (props) => {
  const { setFlag, allFlagsSet } = useFlags(["audit-confirm"]);

  return (
    <BaseModal {...props} okEnabled={allFlagsSet}>
      <div>
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
            Warning
          </Dialog.Title>
          <div className="mt-2">
            <WarningConfirm
              onConfirm={(confirmed: boolean) => {
                setFlag("audit-confirm", confirmed);
              }}
              idx={0}
            >
              <div className="flex flex-col gap-1 py-6 px-2">
                <p className="text-md text-white font-bold">
                  You are about to transact on{" "}
                  <em className="text-white text-md font-bold">Mainnet</em>.
                </p>
                <p className="text-sm text-white">
                  Sunrise is currently in alpha and has not been audited.
                </p>
                <p className="text-sm text-white mt-8">
                  Please proceed with caution.
                </p>
              </div>
            </WarningConfirm>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export { DepositWarningModal };
