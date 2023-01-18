import clx from "classnames";
import { FC, Fragment } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Listbox, Transition } from "@headlessui/react";

enum WithdrawOption {
  Delayed = "Delayed",
  Immediate = "Immediate",
}

interface UnstakeOptionProps {
  delayedWithdraw: boolean;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
}
const UnstakeOption: FC<UnstakeOptionProps> = ({
  delayedWithdraw,
  setDelayedWithdraw,
}) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <UnstakeOptionSelector
        delayedWithdraw={delayedWithdraw}
        setDelayedWithdraw={setDelayedWithdraw}
      />
      {delayedWithdraw ? (
        <span className="text-green-bright text-bold text-lg">Free</span>
      ) : (
        <span className="text-danger text-bold text-lg">3% Fee</span>
      )}
    </div>
  );
};

interface SelectorProps {
  delayedWithdraw: boolean;
  setDelayedWithdraw: (delayedWithdraw: boolean) => void;
}

const UnstakeOptionSelector: FC<SelectorProps> = ({
  delayedWithdraw,
  setDelayedWithdraw,
}) => {
  return (
    <Listbox
      value={
        delayedWithdraw ? WithdrawOption.Delayed : WithdrawOption.Immediate
      }
      onChange={(e) => {
        if (e === WithdrawOption.Delayed) {
          setDelayedWithdraw(true);
        } else {
          setDelayedWithdraw(false);
        }
      }}
    >
      {({ open }) => (
        <>
          <div className="relative">
            <Listbox.Button
              className={({ open }) =>
                clx("w-42 bg-outset py-3 pl-3 pr-10 text-left rounded-", {
                  "rounded-t-md": open,
                  "rounded-md": !open,
                })
              }
            >
              <span className="text-white ml-3 font-bold">
                {delayedWithdraw
                  ? WithdrawOption.Delayed
                  : WithdrawOption.Immediate}
              </span>

              <span className="absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <FiChevronDown
                  className="h-5 w-5 text-green-bright"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute max-h-56 w-full overflow-auto rounded-b bg-outset py-1 text-base border-t border-green-bright  ">
                {delayedWithdraw ? (
                  <Listbox.Option
                    className={"relative cursor-pointer py-2 pl-3 pr-9"}
                    value={WithdrawOption.Immediate}
                  >
                    <div className="flex items-center">
                      <span className="ml-3 font-bold">
                        {WithdrawOption.Immediate}
                      </span>
                    </div>
                  </Listbox.Option>
                ) : (
                  <Listbox.Option
                    className="relative cursor-pointer py-2 pl-3 pr-9"
                    value={WithdrawOption.Delayed}
                  >
                    <div className="flex items-center">
                      <span className="ml-3 font-bold">
                        {WithdrawOption.Delayed}
                      </span>
                    </div>
                  </Listbox.Option>
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

export default UnstakeOption;
