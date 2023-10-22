import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { type AppRoute } from "../../Routes";

interface HelpSettings {
  currentHelpRoute: AppRoute | undefined;
  setCurrentHelpRoute: (route: AppRoute) => void;
}

const HelpContext = createContext<HelpSettings>({
  currentHelpRoute: undefined,
  setCurrentHelpRoute: () => {},
});

const HelpProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentHelpRoute, setCurrentHelpRoute] = useState<AppRoute>();

  return (
    <HelpContext.Provider value={{ currentHelpRoute, setCurrentHelpRoute }}>
      {children}
    </HelpContext.Provider>
  );
};

const useHelp = (): HelpSettings => useContext(HelpContext);

export { HelpProvider, useHelp };
