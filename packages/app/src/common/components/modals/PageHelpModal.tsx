import { Dialog, Transition } from "@headlessui/react";
import { Fragment, type FC } from "react";
import { noop } from "../../utils";
import { GuideSelector } from "../../../guide/components/GuideSelector";

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
          <Dialog.Panel className="relative h-3/4 w-11/12 sm:w-4/5 md:w-3/4 lg:w-1/2 mx-auto overflow-hidden rounded-lg p-2 border border-green text-left bg-white">
            <div className="absolute top-1 right-4 text-right text-green">
              <button onClick={onClose}>x</button>
            </div>
            <GuideSelector />
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export { PageHelpModal };
