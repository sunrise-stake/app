import { type PublicKey } from "@solana/web3.js";
import { type Forest, type TreeNode } from "../api/types";

const IMAGE_COUNT = 1; // only one tree image per level and species at the moment

// Tree-placement constants
// the radius is the distance from the source tree to the neighbours,
// or the difference between each layer (in pixels)
const RADIUS = 400;

// the height is the vertical distance between each layer (in pixels)
// if zero, the trees are placed on a flat plane, and will appear behind each other
// to avoid obscuring trees, we set a positive value here, so neighbours appear slight higher than the source tree
const HEIGHT = 400;

// the part of the circle along which neighbours are placed - in radians
// 2PI = trees are fully surrounding the source tree
// PI = trees are placed on a semi-circle behind the source tree
const ARC = Math.PI * 0.9;

// 10% jitter in tree placement
const JITTER_RANGE = 0.2;

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const WEEK_IN_MS = 7 * DAY_IN_MS;
const MONTH_IN_MS = 30 * DAY_IN_MS;
const YEAR_IN_MS = 365 * DAY_IN_MS;

// TODO temp
enum Species {
  Oak = 0,
  Pine = 1,
  Maple = 2,
}
// This is marginally less hacky than Object.keys(Species).length / 2
const SPECIES_COUNT = 3;

interface Translation {
  x: number;
  y: number;
  z: number;
}

interface TreeType {
  level: number;
  species: Species;
  instance: number;
  translucent: boolean;
}

export interface TreeComponent {
  address: PublicKey;
  imageUri: string;
  translate: Translation;
  metadata: {
    type: TreeType;
    layer: number;
  };
}
const calculateTranslation = (
  layer: number,
  totalInLayer: number,
  indexInLayer: number
): Translation => {
  // spreadSegment is the angle between each neighbour
  // if there is only one neighbour, it is placed in the middle of the arc (and spreadSegment is not used)
  const spreadSegment = totalInLayer > 1 ? ARC / (totalInLayer - 1) : ARC;

  // the starting angle is the angle at which the first neighbour is placed
  // the angle is measured from the positive x-axis, so it should be 90 degrees minus half the arc
  // if the arc is a semi-circle, this will be 0 degrees, which is directly to the right of the source tree
  const startingAngle = Math.PI / 2 - ARC / 2;

  // now we have all the values, we can calculate the position of each neighbour

  // the angle for the neighbour is the start of the arc, plus the spreadSegment multiplied by the index of the neighbour
  const angle = startingAngle + indexInLayer * spreadSegment;
  // we need to make sure the angle is between 0 and 2PI because the Math.sin and Math.cos functions only work with positive values
  const normalisedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

  const jitterAngle = Math.random() * JITTER_RANGE - JITTER_RANGE / 2;

  const x = Math.floor(
    Math.cos(normalisedAngle + jitterAngle) * RADIUS * layer
  );
  const y = Math.floor(
    -Math.sin(normalisedAngle + jitterAngle) * HEIGHT * layer
  );
  const z = Math.floor(
    -Math.sin(normalisedAngle + jitterAngle) * RADIUS * layer
  );
  console.log(
    `${indexInLayer}: arc ${ARC} - spreadSegment ${spreadSegment} - angle ${angle} (${normalisedAngle}) - x: ${x}, y: ${y}, z: ${z}`
  );

  return { x, y, z };
};

// Converts a balance's start date to a level
// TODO consider making this a linear or curved function of the age rather than a bunch of if statements
const balanceAndAgeToLevel = (balance: number, start: Date): number => {
  if (start > new Date(Date.now() - 6 * HOUR_IN_MS)) {
    return 1;
  } else if (start > new Date(Date.now() - 1 * DAY_IN_MS)) {
    // TODO extend these times later after testing is complete
    return 2;
  } else if (start > new Date(Date.now() - 1 * WEEK_IN_MS)) {
    return 3;
  } else if (start > new Date(Date.now() - 1 * MONTH_IN_MS)) {
    return 4;
  } else if (start > new Date(Date.now() - 3 * MONTH_IN_MS)) {
    return 5;
  } else if (start > new Date(Date.now() - 6 * YEAR_IN_MS)) {
    return 6;
  } else if (start > new Date(Date.now() - 6 * YEAR_IN_MS)) {
    return 7;
  } else {
    return 8;
  }
};

const hadGSol = (tree: TreeNode): boolean =>
  tree.totals.currentBalance > 0 ||
  tree.mints.length > 0 ||
  tree.sent.length > 0 ||
  tree.received.length > 0;

const calculateTreeType = (tree: TreeNode): TreeType => {
  const instance = tree.address.toBuffer()[31] % IMAGE_COUNT;
  const species = (tree.address.toBuffer()[30] % SPECIES_COUNT) + 1;
  const didHaveGSol = hadGSol(tree);
  const translucent = didHaveGSol && tree.totals.currentBalance === 0;
  const level = didHaveGSol
    ? balanceAndAgeToLevel(tree.totals.amountTotal, tree.startDate)
    : 0;
  return { instance, species, level, translucent };
};

const treeImageUri = (treeType: TreeType): string => {
  console.log(treeType);
  return `https://api.sunrisestake.com/assets/tree/Tree0000.png`;
  // return `https://api.sunrisestake.com/assets/tree/Tree0${treeType.level}0${treeType.species}.png`;
};

const treeNodeToComponent = (
  tree: TreeNode,
  layer: number,
  indexInLayer: number,
  totalInLayer: number
): TreeComponent => ({
  address: tree.address,
  translate: calculateTranslation(layer, totalInLayer, indexInLayer),
  imageUri: treeImageUri(calculateTreeType(tree)),
  metadata: {
    type: calculateTreeType(tree),
    layer,
  },
});

export const forestToComponents = (forest: Forest): TreeComponent[] => {
  const recursiveForestToFlatTrees = (
    queue: Array<{ forest: Forest; layer: number }>,
    result: TreeNode[][]
  ): TreeNode[][] => {
    if (queue.length === 0) return result;
    const { forest: nextInQueue, layer: currentLayer } = queue.shift() as {
      forest: Forest;
      layer: number;
    };
    const map = nextInQueue.neighbours.map((neighbour) => ({
      forest: neighbour,
      layer: currentLayer + 1,
    }));
    queue.push(...map);

    if (currentLayer >= result.length) result.push([]);
    result[currentLayer].push(
      ...nextInQueue.neighbours.map((neighbour) => neighbour.tree)
    );

    console.log("currentLayer", currentLayer);
    console.log("queue", queue);
    console.log("result", result);

    return recursiveForestToFlatTrees(queue, result);
  };

  const flatTrees = recursiveForestToFlatTrees(
    [{ forest, layer: 1 }],
    [[forest.tree]]
  );
  console.log("flatTrees", flatTrees);

  return flatTrees.flatMap((treesInLayer, layer) =>
    treesInLayer.map((tree, indexInLayer) => {
      console.log(
        "Adding tree ",
        forest.tree.address.toBase58(),
        "to layer:",
        layer,
        "at index: ",
        indexInLayer,
        "of",
        treesInLayer.length
      );
      return treeNodeToComponent(
        tree,
        layer,
        indexInLayer,
        treesInLayer.length
      );
    })
  );
};
