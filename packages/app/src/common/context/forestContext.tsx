import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { forestToComponents, type TreeComponent } from "../../forest/utils";
import { ForestService, MAX_FOREST_DEPTH } from "../../api/forest";
import { useSunriseStake } from "./sunriseStakeContext";
import { useLocation } from "react-router-dom";
import { type PublicKey } from "@solana/web3.js";
import { safeParsePublicKey } from "../utils";

interface ForestContextProps {
  myTree: TreeComponent | undefined;
  neighbours: TreeComponent[];
  update: () => void;
}
const defaultValue: ForestContextProps = {
  myTree: undefined,
  neighbours: [],
  update: () => {},
};
const ForestContext = createContext<ForestContextProps>(defaultValue);

const ForestProvider: FC<{ children: ReactNode; depth?: number }> = ({
  children,
  depth = MAX_FOREST_DEPTH,
}) => {
  const { client, details } = useSunriseStake();
  const wallet = useWallet();
  const { connection } = useConnection();
  const location = useLocation();
  const [service, setService] = useState<ForestService | undefined>();
  const [neighbours, setNeighbours] = useState<TreeComponent[]>([]);
  const [myTree, setMyTree] = useState<TreeComponent>();

  const address: PublicKey | null = useMemo(
    () => safeParsePublicKey(location.state?.address) ?? wallet.publicKey,
    [location.state?.address, wallet.publicKey]
  );

  const loadTree = useCallback(
    (reload = false) => {
      void (async () => {
        if (service && address) {
          console.log(
            "forestContext: loadTree useCallback",
            address.toBase58(),
            reload
          );
          const forest = await service.getForest(
            address,
            depth,
            undefined,
            reload
          );
          const components = forestToComponents(forest);
          setMyTree(components[0]);
          setNeighbours(components.slice(1));
        }
      })();
    },
    [service, address]
  );

  // reload tree when details change. doesn't matter what changed.
  useEffect(() => {
    // do not trigger if the tree is not already loaded
    if (details && myTree) {
      // add a delay to give the backend database a chance to hear the transaction before we reload the tree
      setTimeout(() => {
        loadTree(true);
      }, 5000);
    }
  }, [details]);

  useEffect(() => {
    if (client) {
      console.log("forestContext: creating forest service useEffect");
      const service = new ForestService(connection, client);
      setService(service);
    }
  }, [client]);

  useEffect(() => {
    console.log("forestContext: loading tree useEffect", address);
    loadTree();
  }, [service, address]);

  return (
    <ForestContext.Provider
      value={{
        myTree,
        neighbours,
        update: () => {
          loadTree(true);
        },
      }}
    >
      {children}
    </ForestContext.Provider>
  );
};

const useForest = (): ForestContextProps => useContext(ForestContext);

export { ForestProvider, useForest };
