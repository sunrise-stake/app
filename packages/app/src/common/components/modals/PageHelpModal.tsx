import { Dialog, Transition } from "@headlessui/react";
import { Fragment, type FC } from "react";
import { noop } from "../../utils";
import { GuideSelector } from "../../../guide/GuideSelector";

const PageHelpModal: FC<{ show: boolean; onClose?: () => void }> = ({
  show = false,
  onClose = noop,
}) => {
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
        className="fixed z-30 inset-0 overflow-y-auto backdrop-blur-sm"
        onClose={onClose}
        open={show}
      >
        <div className="flex items-center h-full">
          <Dialog.Panel className="container rounded-lg p-4 border border-green text-left bg-white">
            <div className="text-right text-green">
              <button onClick={onClose}>X</button>
            </div>
            <GuideSelector />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export { PageHelpModal };
