import clx from "classnames";
import { FC, Fragment, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Listbox, Transition } from "@headlessui/react";

const UnstakeOption: FC = () => {
  const [selected, setSelected] = useState(0);
  const options = ["Delayed", "Immediate"];
  return (
    <div className="flex flex-row items-center gap-4">
      <UnstakeOptionSelector
        selected={selected}
        setSelected={setSelected}
        options={options}
      />
      {selected === 0 ? (
        <span className="text-green-bright text-bold text-lg">Free</span>
      ) : (
        <span className="text-danger text-bold text-lg">3% Fee</span>
      )}
    </div>
  );
};

interface SelectorProps {
  selected: number;
  setSelected: any;
  options: string[];
}

const UnstakeOptionSelector: FC<SelectorProps> = ({
  selected,
  setSelected,
  options,
}) => {
  return (
    <Listbox value={selected} onChange={setSelected}>
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
                {options[selected]}
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
                {selected === 1 ? (
                  <Listbox.Option
                    className={"relative cursor-pointer py-2 pl-3 pr-9"}
                    value={0}
                  >
                    <div className="flex items-center">
                      <span className="ml-3 font-bold">Delayed</span>
                    </div>
                  </Listbox.Option>
                ) : (
                  <Listbox.Option
                    className="relative cursor-pointer py-2 pl-3 pr-9"
                    value={1}
                  >
                    <div className="flex items-center">
                      <span className="ml-3 font-bold">Immediate</span>
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
