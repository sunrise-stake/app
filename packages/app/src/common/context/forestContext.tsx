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
          const gsolBalance = Number(details.balances.gsolBalance.amount) || 0;
          // lockDetails.amountLocked is in BN (lamports), convert to SOL
          const lockedBalance = details.lockDetails?.amountLocked
            ? Number(details.lockDetails.amountLocked.toString()) / 1e9
            : 0;
          const totalBalance = gsolBalance + lockedBalance;

          // Calculate level based on balance thresholds
          // Level 0: 0 gSOL
          // Level 1: 0.001 - 1 gSOL
          // Level 2: 1 - 10 gSOL
          // Level 3: 10 - 50 gSOL
          // Level 4: 50 - 100 gSOL
          // Level 5: 100 - 500 gSOL
          // Level 6: 500 - 1000 gSOL
          // Level 7: 1000 - 5000 gSOL
          // Level 8: 5000+ gSOL
          let level = 0;
          if (totalBalance > 0) {
            if (totalBalance < 1) level = 1;
            else if (totalBalance < 10) level = 2;
            else if (totalBalance < 50) level = 3;
            else if (totalBalance < 100) level = 4;
            else if (totalBalance < 500) level = 5;
            else if (totalBalance < 1000) level = 6;
            else if (totalBalance < 5000) level = 7;
            else level = 8;
          }

          // Calculate species and instance from address for visual variety
          const addressBytes = address.toBuffer();
          const instance = addressBytes[31] % 3; // Assuming 3 tree variations per species
          const species = (addressBytes[30] % 3) + 1; // Assuming 3 species (1-3)

          const minimalTree: TreeComponent = {
            address,
            translate: { x: 0, y: 0, z: 0 },
            metadata: {
              type: {
                level,
                species,
                instance,
                translucent: false,
              },
              node: {
                address,
                balance: totalBalance,
                startDate: new Date(),
                mostRecentTransfer: new Date(),
                children: [],
                parents: [],
              },
              layer: 0,
            },
          };

          setMyTree(minimalTree);
        } catch (error) {
          console.error("Error creating minimal tree:", error);
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
