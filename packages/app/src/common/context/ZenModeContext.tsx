import {
  createContext,
  type Dispatch,
  type FC,
  type ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";

export interface ZenModeSettings {
  showBGImage: boolean;
  showExternalLinks: boolean;
  showHelpButton: boolean;
  showWallet: boolean;
}

const ZenModeContext = createContext<
  [ZenModeSettings, Dispatch<React.SetStateAction<ZenModeSettings>>]
>([
  {
    showBGImage: false,
    showExternalLinks: false,
    showHelpButton: false,
    showWallet: false,
  },
  (v) => v,
]);

const ZenModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [zenMode, updateZenMode] = useState({
    showBGImage: false,
    showExternalLinks: false,
    showHelpButton: false,
    showWallet: false,
  });
  useEffect(() => {
    updateZenMode({
      showBGImage: true,
      showExternalLinks: true,
      showHelpButton: true,
      showWallet: false,
    });
  }, []);

  return (
    <ZenModeContext.Provider value={[zenMode, updateZenMode]}>
      {children}
    </ZenModeContext.Provider>
  );
};

const useZenMode = (): [
  ZenModeSettings,
  Dispatch<React.SetStateAction<ZenModeSettings>>
] => useContext(ZenModeContext);

export { ZenModeProvider, useZenMode };
