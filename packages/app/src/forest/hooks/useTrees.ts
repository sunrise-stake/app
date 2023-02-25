import { useEffect, useState } from "react";
import { forestToComponents, type TreeComponent } from "../utils";
import { getForest } from "../../api/forest";
import { useWallet } from "@solana/wallet-adapter-react";

export const useTrees = (): {
  myTree: TreeComponent | undefined;
  neighbours: TreeComponent[];
} => {
  const wallet = useWallet();
  const [neighbours, setNeighbours] = useState<TreeComponent[]>([]);
  const [myTree, setMyTree] = useState<TreeComponent>();

  useEffect(() => {
    void (async () => {
      if (wallet.connected && wallet.publicKey) {
        const forest = await getForest(wallet.publicKey, 1);

        setNeighbours(forestToComponents(forest));

        setMyTree({
          address: wallet.publicKey,
          translate: {
            x: 0,
            y: 0,
            z: 0,
          },
          metadata: {
            // TODO
          },
        });
      }
    })();
  }, [wallet.publicKey?.toBase58()]);

  return { myTree, neighbours };
};
