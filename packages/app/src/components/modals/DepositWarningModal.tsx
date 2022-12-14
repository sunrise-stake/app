import BaseModal, { ModalProps } from "./BaseModal";
import React, { FC } from "react";
import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import useFlags from "../../hooks/useFlags";
import WarningConfirm from "./WarningConfirm";

const DepositWarningModal: FC<ModalProps> = (props) => {
  const { setFlag, allFlagsSet } = useFlags(["audit-confirm"]);

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
            Warning
          </Dialog.Title>
          <div className="mt-2">
            <WarningConfirm
              onConfirm={(confirmed: boolean) =>
                setFlag("audit-confirm", confirmed)
              }
              idx={0}
            >
              <p className="text-sm text-gray-900">
                You are about to transact on{" "}
                <em className="text-gray-900">Mainnet</em>.
              </p>
              <p className="text-sm text-gray-900">
                Sunrise is currently in alpha and has not been audited. Please
                proceed with caution.
              </p>
            </WarningConfirm>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default DepositWarningModal;
