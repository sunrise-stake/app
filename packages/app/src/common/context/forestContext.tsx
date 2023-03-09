import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { forestToComponents, type TreeComponent } from "../../forest/utils";
import { getForest, MAX_FOREST_DEPTH } from "../../api/forest";

interface ForestContextProps {
  myTree: TreeComponent | undefined;
  neighbours: TreeComponent[];
}
const defaultValue: ForestContextProps = {
  myTree: undefined,
  neighbours: [],
};
const ForestContext = createContext<ForestContextProps>(defaultValue);

const ForestProvider: FC<{ children: ReactNode; depth?: number }> = ({
  children,
  depth = MAX_FOREST_DEPTH,
}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [neighbours, setNeighbours] = useState<TreeComponent[]>([]);
  const [myTree, setMyTree] = useState<TreeComponent>();

  useEffect(() => {
    void (async () => {
      console.log("useTrees", wallet.publicKey?.toBase58());
      if (wallet.connected && wallet.publicKey) {
        console.log("Getting forest..." + new Date().toISOString());
        const forest = await getForest(connection, wallet.publicKey, depth);
        console.log("Got forest. " + new Date().toISOString());

        const components = forestToComponents(forest);

        console.log("forest", forest);
        console.log("components", components);

        setMyTree(components[0]);
        setNeighbours(components.slice(1));
      }
    })();
  }, [wallet.publicKey]);

  return (
    <ForestContext.Provider value={{ myTree, neighbours }}>
      {children}
    </ForestContext.Provider>
  );
};

const useForest = (): ForestContextProps => useContext(ForestContext);

export { ForestProvider, useForest };
