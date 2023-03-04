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
  showWallet: boolean;
}

const ZenModeContext = createContext<
  [ZenModeSettings, Dispatch<ZenModeSettings>]
>([{ showBGImage: false, showWallet: false }, (v) => v]);

const ZenModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [zenMode, updateZenMode] = useState({
    showBGImage: false,
    showWallet: false,
  });
  useEffect(() => {
    updateZenMode({ showBGImage: true, showWallet: false });
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
