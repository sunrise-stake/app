import { Dialog, Transition } from "@headlessui/react";
import { Fragment, type FC } from "react";
import { noop } from "../../utils";
import { GuideSelector } from "../../../guide/components/GuideSelector";

const PageHelpModal: FC<{ show: boolean; onClose?: () => void }> = ({
  show = false,
  onClose = noop,
}) => {
  return (
    <Transition as={Fragment} show={show}>
      <Dialog className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enterFrom="opacity-0 backdrop-blur-0"
          enterTo="opacity-100 backdrop-blur-sm"
          enter="ease-in duration-200"
          leaveFrom="opacity-100 backdrop-blur-sm"
          leaveTo="opacity-0 backdrop-blur-0"
          leave="ease-out duration-200"
        >
          <div className="fixed inset-0" aria-hidden="true"></div>
        </Transition.Child>
        <div className="fixed inset-0 flex items-center h-full">
          <Transition.Child
            as={Fragment}
            enterFrom="opacity-0"
            enterTo="opacity-100"
            enter="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            leave="ease-out duration-200"
          >
            <Dialog.Panel className="relative h-3/4 w-11/12 sm:w-4/5 md:w-3/4 lg:w-1/2 mx-auto overflow-hidden rounded-lg p-2 border border-green text-left bg-white">
              <div className="absolute top-1 right-4 text-right text-green">
                <button onClick={onClose}>x</button>
              </div>
              <GuideSelector />
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export { PageHelpModal };
