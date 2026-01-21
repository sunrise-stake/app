import { useWindowSize } from "usehooks-ts";
import { useMemo } from "react";
import { isMobilePortrait } from "../../common/utils";

export const useScreenOrientation = (): {
  screenType: "mobilePortrait" | "landscapeOrDesktop";
} => {
  const windowSize = useWindowSize();
  const isPortrait = useMemo(
    () => isMobilePortrait(windowSize.width),
    [windowSize]
  );

  return {
    screenType: isPortrait ? "mobilePortrait" : "landscapeOrDesktop",
  };
};
