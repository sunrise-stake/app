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
      // Create a minimal tree object based on wallet connection status
      if (address && details) {
        try {
          // Create a simple tree representation without MongoDB calls
          const balance = details.balances.gsolBalance.amount || 0;
          const hasBalance = balance > 0;
          
          const minimalTree: TreeComponent = {
            address,
            translate: { x: 0, y: 0, z: 0 },
            metadata: {
              type: {
                level: hasBalance ? 1 : 0,
                species: 1,
                instance: 0,
                translucent: false,
              },
              node: {
                address,
                balance: Number(balance),
                startDate: new Date(),
                mostRecentTransfer: new Date(),
                children: [],
                parents: []
              },
              layer: 0,
            }
          };
          
          setMyTree(minimalTree);
        } catch (error) {
          console.error('Error creating minimal tree:', error);
          // Don't set tree on error to avoid breaking the UI
        }
      }
    },
    [address, details]
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
