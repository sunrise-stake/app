import { type Forest } from "../api/forest";
import { PublicKey } from "@solana/web3.js";

export interface TreeComponent {
  address: PublicKey;
  translate: {
    x: number;
    y: number;
    z: number;
  };
  metadata: {
    // TODO
  };
}

export const forestToComponents = (forest: Forest): TreeComponent[] => {
  const toComponent = (
    address: PublicKey,
    levelIndex: number,
    indexInLevel: number,
    totalInLevel: number
  ): TreeComponent => {
    const level = levelIndex + 1;

    // TODO make a curve rather than a line
    // also add some randomness
    const minXForLevel = -600 * level;
    const maxXForLevel = 600 * level;
    const xInterval = (maxXForLevel - minXForLevel) / (totalInLevel - 1);

    const minYForLevel = -50 * level;
    // const maxYForLevel = minYForLevel - 50;
    const yForLevel = minYForLevel;
    const zForLevel = -50 * level;
    return {
      address,
      translate: {
        x: indexInLevel * xInterval + minXForLevel,
        y: yForLevel,
        z: zForLevel,
      },
      metadata: {
        // TODO
      },
    };
  };

  const totalForLevel = (level: number): number =>
    Object.entries(forest.neighbors[level]).length;

  // add a component for each neighbour
  return forest.neighbors.flatMap((trees, level) =>
    Object.entries(trees).map(([address, neighbor], indexInLevel) =>
      toComponent(
        new PublicKey(address),
        level,
        indexInLevel,
        totalForLevel(level)
      )
    )
  );
};
