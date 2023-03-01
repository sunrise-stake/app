import {
  createContext,
  type Dispatch,
  type FC,
  type ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";

const BGImageContext = createContext<[boolean, Dispatch<boolean>]>([
  false,
  (v) => v,
]);

const BGImageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [showBGImage, updateShowBGImage] = useState(false);
  useEffect(() => {
    updateShowBGImage(true);
  }, []);

  return (
    <BGImageContext.Provider value={[showBGImage, updateShowBGImage]}>
      {children}
    </BGImageContext.Provider>
  );
};

const useBGImage = (): [boolean, Dispatch<boolean>] =>
  useContext(BGImageContext);

export { BGImageProvider, useBGImage };
