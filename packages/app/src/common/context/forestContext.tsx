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
import { ForestService, MAX_FOREST_DEPTH } from "../../api/forest";
import { useSunriseStake } from "./sunriseStakeContext";

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
  const { client } = useSunriseStake();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [service, setService] = useState<ForestService | undefined>();
  const [neighbours, setNeighbours] = useState<TreeComponent[]>([]);
  const [myTree, setMyTree] = useState<TreeComponent>();

  useEffect(() => {
    if (client) {
      const service = new ForestService(connection);
      setService(service);
    }
  }, [client]);

  useEffect(() => {
    void (async () => {
      if (service && wallet.publicKey) {
        console.log("Getting forest..." + new Date().toISOString());
        const forest = await service.getForest(wallet.publicKey, depth);
        console.log("Got forest. " + new Date().toISOString());

        const components = forestToComponents(forest);

        console.log("forest", forest);
        console.log("components", components);

        setMyTree(components[0]);
        setNeighbours(components.slice(1));
      }
    })();
  }, [service, wallet.publicKey]);

  return (
    <ForestContext.Provider value={{ myTree, neighbours }}>
      {children}
    </ForestContext.Provider>
  );
};

const useForest = (): ForestContextProps => useContext(ForestContext);

export { ForestProvider, useForest };
