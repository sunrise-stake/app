import { useEffect, useState } from "react";
import { forestToComponents, type TreeComponent } from "../utils";
import { getForest, MAX_FOREST_DEPTH } from "../../api/forest";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export const useTrees = (
  depth: number = MAX_FOREST_DEPTH
): {
  myTree: TreeComponent | undefined;
  neighbours: TreeComponent[];
} => {
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
  }, [wallet.publicKey?.toBase58()]);

  return { myTree, neighbours };
};
