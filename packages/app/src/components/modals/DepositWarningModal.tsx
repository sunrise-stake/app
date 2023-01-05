import BaseModal, { ModalProps } from "./BaseModal";
import React, { FC, ReactNode } from "react";
import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import useFlags from "../../hooks/useFlags";

const WarningConfirm: FC<{
  onConfirm: (confirmed: boolean) => void;
  idx: number;
  children: ReactNode;
}> = ({ onConfirm, idx, children }) => (
  <div className="border-2 border-gray-300 m-5 p-5 text-start">
    {children}
    <div className="relative flex mt-5">
      <div className="flex h-5">
        <input
          id={`checkbox-${idx}`}
          aria-describedby={`checkbox-description-${idx}`}
          name={`checkbox-${idx}`}
          type="checkbox"
          onChange={(e) => onConfirm(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>
      <div className="ml-3 text-sm">
        <label
          htmlFor={`checkbox-${idx}`}
          className="font-medium text-gray-700"
        >
          I understand
        </label>
      </div>
    </div>
  </div>
);

const DepositWarningModal: FC<ModalProps> = (props) => {
  const { setFlag, allFlagsSet } = useFlags(["audit-confirm", "fee-confirm"]);

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
            <WarningConfirm
              onConfirm={(confirmed: boolean) =>
                setFlag("fee-confirm", confirmed)
              }
              idx={1}
            >
              <p className="text-sm text-gray-900">
                Sunrise Stake currently supports{" "}
                <a
                  href="https://docs.marinade.finance/faq/faq#what-is-liquid-staking"
                  target="_blank"
                  rel="noreferrer"
                >
                  liquid unstaking
                </a>{" "}
                only.
              </p>
              <p className="text-sm text-gray-900">
                Until delayed unstaking is implemented, unstaking will incur a
                0.3-3% fee, depending on the stake size.
              </p>
            </WarningConfirm>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default DepositWarningModal;
