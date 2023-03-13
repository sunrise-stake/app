import {
  createContext,
  type Dispatch,
  type FC,
  type ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";

interface ZenModeSettings {
  showBGImage: boolean;
  showHelpButton: boolean;

  showExternalLinks: boolean;
  showWallet: boolean;
}

const ZenModeContext = createContext<
  [ZenModeSettings, Dispatch<ZenModeSettings>]
>([
  {
    showBGImage: false,
    showHelpButton: false,
    showExternalLinks: false,
    showWallet: false,
  },
  (v) => v,
]);

const ZenModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [zenMode, updateZenMode] = useState({
    showBGImage: false,
    showHelpButton: false,
    showExternalLinks: false,
    showWallet: false,
  });
  useEffect(() => {
    updateZenMode({
      showBGImage: true,
      showHelpButton: true,
      showExternalLinks: true,
      showWallet: false,
    });
  }, []);

  return (
    <ZenModeContext.Provider value={[zenMode, updateZenMode]}>
      {children}
    </ZenModeContext.Provider>
  );
};

const useZenMode = (): [ZenModeSettings, Dispatch<ZenModeSettings>] =>
  useContext(ZenModeContext);

export { ZenModeProvider, useZenMode };
