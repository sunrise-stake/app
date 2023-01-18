import { FC, Fragment, ReactNode, useCallback, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { GiCancel } from "react-icons/gi";
import { BiRightArrowAlt } from "react-icons/bi";

export interface ModalProps {
  ok: () => void;
  cancel: () => void;
}
type Props = ModalProps & {
  children?: ReactNode;
  okEnabled?: boolean;
};
const BaseModal: FC<Props> = ({ children, ok, cancel, okEnabled = true }) => {
  const [isOpen, setIsOpen] = useState(true);
  const cancelButtonRef = useRef(null);

  const clickOk = useCallback(() => {
    ok();
    setIsOpen(false);
  }, [ok]);

  const clickCancel = useCallback(() => {
    cancel();
    setIsOpen(false);
  }, [cancel]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={setIsOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-outset px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm md:max-w-lg sm:p-6">
                {children}
                <div className="mx-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-32 items-center text-center">
                  <button
                    disabled={!okEnabled}
                    type="button"
                    className={
                      "inline-flex w-full justify-center items-center rounded-md border border-transparent bg-green px-4 py-2 text-base font-medium text-white shadow-sm " +
                      "hover:opacity-70 " +
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
                      "disabled:opacity-50 disabled:cursor-not-allowed " +
                      "sm:col-start-2 sm:text-sm"
                    }
                    onClick={clickOk}
                  >
                    <div className="font-bold">Continue</div>{" "}
                    <BiRightArrowAlt className="ml-2" size={16} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center mt-3 w-full justify-center rounded-md  bg-danger px-4 py-2 text-base font-medium shadow-sm text-white hover:opacity-70 sm:col-start-1 sm:mt-0 sm:text-sm"
                    onClick={clickCancel}
                    ref={cancelButtonRef}
                  >
                    <div className="font-bold">Cancel</div>{" "}
                    <GiCancel className="ml-2" size={16} />
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default BaseModal;
