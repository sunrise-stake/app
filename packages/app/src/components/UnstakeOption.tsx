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
          <div className="relative mt-1">
            <Listbox.Button className="w-42 rounded-md bg-outset py-3 pl-3 pr-10 text-left ">
              <span className="text-white ml-3">{options[selected]}</span>

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
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <Listbox.Option
                  className="text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9"
                  value={0}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center">
                        <span
                          className={clx(
                            {
                              "font-semibold": selected,
                              "font-normal": !selected,
                            },
                            "ml-3"
                          )}
                        >
                          Delayed
                        </span>
                      </div>
                    </>
                  )}
                </Listbox.Option>
                <Listbox.Option
                  className="text-gray-900 relative py-2 pl-3 pr-9"
                  value={1}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center">
                        <span
                          className={clx(
                            {
                              "font-semibold": selected,
                              "font-normal": !selected,
                            },
                            "ml-3"
                          )}
                        >
                          Immediate
                        </span>
                      </div>
                    </>
                  )}
                </Listbox.Option>
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

export default UnstakeOption;
