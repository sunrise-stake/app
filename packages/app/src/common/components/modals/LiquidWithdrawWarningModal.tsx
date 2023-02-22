import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import React, { type FC } from "react";

import { useFlags } from "../../hooks";
import { BaseModal, type ModalProps, WarningConfirm } from "./";

const LiquidWithdrawWarningModal: FC<ModalProps> = (props) => {
  const { setFlag, allFlagsSet } = useFlags(["fee-confirm"]);

  return (
    <BaseModal {...props} okEnabled={allFlagsSet}>
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900 text-center"
          >
            Note
          </Dialog.Title>
          <div className="mt-2">
            <WarningConfirm
              onConfirm={(confirmed: boolean) => {
                setFlag("fee-confirm", confirmed);
              }}
              idx={1}
            >
              <p className="text-sm text-gray-900">
                You have chosen to withdraw using liquid staking, which incurs a
                0.3-3% fee, depending on the stake size.
              </p>
            </WarningConfirm>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export { LiquidWithdrawWarningModal };
