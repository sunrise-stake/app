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
import { type TreeComponent } from "../../forest/utils";
import { ForestService, MAX_FOREST_DEPTH } from "../../api/forest";
import { useSunriseStake } from "./sunriseStakeContext";
import { type PublicKey } from "@solana/web3.js";
import { safeParsePublicKeyFromUrl } from "../utils";

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
  const [service, setService] = useState<ForestService | undefined>();
  const [neighbours] = useState<TreeComponent[]>([]);
  const [myTree, setMyTree] = useState<TreeComponent>();

  const address: PublicKey | null = useMemo(
    () => safeParsePublicKeyFromUrl() ?? wallet.publicKey,
    [wallet.publicKey]
  );

  const loadTree = useCallback(
    (reload = false) => {
      // Forest feature disabled - no neighbor retrieval
      // Set a default tree based on user details instead of fetching from MongoDB
      if (address && details) {
        // Create a minimal tree object from the user's details
        const defaultTree: TreeComponent = {
          address,
          metadata: {
            type: {
              level: (details.balances.gsolBalance.uiAmount ?? 0) > 0 ? 1 : 0,
              translucent: false,
            },
          },
          // Add any other required TreeComponent properties with defaults
        } as TreeComponent;

        setMyTree(defaultTree);
      }
    },
    [service, address, details]
  );

  // reload tree when details change. doesn't matter what changed.
  useEffect(() => {
    if (details) {
      // add a delay to give the backend database a chance to hear the transaction before we reload the tree
      setTimeout(() => {
        loadTree(true);
      }, 5000);
    }
  }, [details]);

  useEffect(() => {
    if (client) {
      const service = new ForestService(connection, client);
      setService(service);
    }
  }, [client]);

  useEffect(loadTree, [service, address]);

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
