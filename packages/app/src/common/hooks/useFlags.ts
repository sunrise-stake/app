import { useCallback, useMemo, useState } from "react";

interface Flags<T extends string> {
  allFlagsSet: boolean;
  setFlag: (flag: T, value: boolean) => void;
}
const useFlags = <T extends string>(flags: T[]): Flags<T> => {
  const allFalse: Record<T, boolean> = flags.reduce<Record<T, boolean>>(
    (acc, flag) => ({ ...acc, [flag]: false }),
    // tsc and eslint do not see eye-to-eye on this line. If the linter autofixes, it causes a type error.
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter, @typescript-eslint/consistent-type-assertions
    {} as Record<T, boolean>
  );
  const [flagValues, setFlagValues] = useState(allFalse);

  const setFlag = useCallback(
    (flag: T, value: boolean) => {
      setFlagValues({
        ...flagValues,
        [flag]: value,
      });
    },
    [flagValues, setFlagValues]
  );

  const allFlagsSet = useMemo(
    () => flags.every((flag) => flagValues[flag]),
    [flags, flagValues]
  );

  return {
    setFlag,
    allFlagsSet,
  };
};

export { useFlags };
