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
  showWallet: boolean;
}

const ZenModeContext = createContext<
  [ZenModeSettings, Dispatch<ZenModeSettings>]
>([{ showBGImage: false, showHelpButton: false, showWallet: false }, (v) => v]);

const ZenModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [zenMode, updateZenMode] = useState({
    showBGImage: false,
    showHelpButton: false,
    showWallet: false,
  });
  useEffect(() => {
    updateZenMode({
      showBGImage: true,
      showHelpButton: false,
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
