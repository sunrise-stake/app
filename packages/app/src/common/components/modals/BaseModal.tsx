import { Dialog, Transition } from "@headlessui/react";
import { Fragment, type FC, type ReactNode } from "react";
import { FiArrowRight } from "react-icons/fi";
import { GiCancel } from "react-icons/gi";

import { Button } from "../Button";

interface ModalProps {
  ok: () => void;
  cancel: () => void;
  show: boolean;
}

type Props = ModalProps & {
  children?: ReactNode;
  okEnabled?: boolean;
  showActions?: boolean;
};

const BaseModal: FC<Props> = ({
  children,
  ok,
  cancel,
  okEnabled = true,
  showActions = true,
  show,
}) => {
  const clickOk = (): void => {
    ok();
  };

  const clickCancel = (): void => {
    cancel();
  };

  return (
    <Transition
      as={Fragment}
      show={show}
      enterFrom="opacity-0"
      enterTo="opacity-100"
      enter="transition-opacity ease-in duration-500"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      leave="transition-opacity ease-out duration-200"
    >
      <Dialog
        onClose={clickCancel}
        className="fixed z-30 inset-0 overflow-y-auto backdrop-blur-sm"
      >
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
          <Dialog.Panel className="overflow-hidden rounded-lg px-4 pt-5 pb-4 border border-green text-left bg-white shadow-xll sm:my-8 sm:w-full sm:max-w-sm md:max-w-lg sm:p-6">
            <div className="-mt-4 flex justify-end">
              <div onClick={clickCancel}>x</div>
            </div>
            {children}
            {showActions && (
              <div className="mx-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-32 items-center text-center">
                <Button
                  disabled={!okEnabled}
                  color="primary"
                  className={
                    "w-full justify-center items-center " +
                    "hover:opacity-70 " +
                    "disabled:opacity-50 disabled:cursor-not-allowed " +
                    "sm:col-start-2 sm:text-sm"
                  }
                  onClick={clickOk}
                >
                  <div className="font-bold">Continue</div>{" "}
                  <FiArrowRight className="ml-2 scale-150" />
                </Button>
                <Button
                  color="secondary"
                  className="mt-3 items-center w-full justify-center hover:opacity-70 sm:col-start-1 sm:mt-0 sm:text-sm"
                  onClick={clickCancel}
                >
                  <div className="font-bold">Cancel</div>{" "}
                  <GiCancel className="ml-2" />
                </Button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export { BaseModal, type ModalProps };
