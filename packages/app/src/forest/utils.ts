import { type PublicKey } from "@solana/web3.js";
import { type Forest, type TreeNode } from "../api/types";
import { getMostRecentActivity, isDeadTree } from "../api/util";

// If true, include trees with zero current balance in the forest
const SHOW_DEAD_TREES = false;
// Remove trees to ensure the total visible stays below this value
const MAX_TREE_TOTAL_LIMIT = 25;
// Remove trees at a particular layer to ensure each layer does not get too large.
// This is a multiplier, so X * layer
const MAX_TREE_MULTIPLIER_PER_LAYER_LIMIT = 5;

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
  translate: Translation;
  metadata: {
    type: TreeType;
    node: TreeNode;
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

const treeNodeToComponent = (
  tree: TreeNode,
  layer: number,
  indexInLayer: number,
  totalInLayer: number
): TreeComponent => ({
  address: tree.address,
  translate: calculateTranslation(layer, totalInLayer, indexInLayer),
  metadata: {
    type: calculateTreeType(tree),
    node: tree,
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

    return recursiveForestToFlatTrees(queue, result);
  };

  // We have a DAG of trees, we need to convert them into an array of TreeComponents[]
  // While doing so, we will prune trees based on a number of properties
  // We need to know the number of trees at each layer *after* this pruning has taken place

  // returns an array of arrays, where each element is a layer
  const flatTrees = recursiveForestToFlatTrees(
    [{ forest, layer: 1 }],
    [[forest.tree]]
  );
  // convert the array of arrays into a flat array of all the trees, remembering their layer, so that we can order and prune
  const allTreeNodes = flatTrees.flatMap((treesInLayer, index) =>
    treesInLayer.map((tree) => ({ tree, layer: index }))
  );

  // prune all the trees
  const prunedTrees = prune(allTreeNodes);

  // Convert back to the array of arrays now that they are pruned, so that we can turn them into tree components
  const treesWithinLayers = prunedTrees.reduce<TreeNode[][]>(
    (acc, { tree, layer }) => {
      if (acc[layer] === undefined) acc[layer] = [];
      acc[layer].push(tree);
      return acc;
    },
    []
  );

  // now convert the trees to components
  return treesWithinLayers.flatMap((treesInLayer, layer) =>
    treesInLayer.map((tree, indexInLayer) =>
      treeNodeToComponent(tree, layer, indexInLayer, treesInLayer.length)
    )
  );
};

interface TreeWithLayer {
  tree: TreeNode;
  layer: number;
}
interface ComparisonStats {
  mostRecentActivity: Date;
  amount: number;
  layer: number;
  neighbours: number;
}
const comparisonWeights: Record<
  keyof ComparisonStats,
  { weight: number; direction: "BIGGER_IS_BETTER" | "SMALLER_IS_BETTER" }
> = {
  mostRecentActivity: { weight: 10, direction: "BIGGER_IS_BETTER" },
  amount: { weight: 5, direction: "BIGGER_IS_BETTER" },
  layer: { weight: 5, direction: "SMALLER_IS_BETTER" },
  neighbours: { weight: 20, direction: "BIGGER_IS_BETTER" },
};
const getComparisonStats = ({
  tree,
  layer,
}: TreeWithLayer): ComparisonStats => ({
  amount: tree.totals.amountTotal,
  mostRecentActivity: getMostRecentActivity(tree),
  layer,
  neighbours:
    tree.totals.uniqueRecipients.length + tree.totals.uniqueSenders.length,
});
const compareTrees = (a: TreeWithLayer, b: TreeWithLayer): number => {
  const statsA = getComparisonStats(a);
  const statsB = getComparisonStats(b);

  return Object.keys(comparisonWeights).reduce((acc, key) => {
    const comparisonKey = key as keyof ComparisonStats;
    const aScore = statsA[comparisonKey];
    const bScore = statsB[comparisonKey];

    if (
      aScore > bScore &&
      comparisonWeights[comparisonKey].direction === "BIGGER_IS_BETTER"
    ) {
      return acc - comparisonWeights[comparisonKey].weight;
    } else {
      return acc + comparisonWeights[comparisonKey].weight;
    }
  }, 0);
};

const filterByLayer = (sortedTrees: TreeWithLayer[]): TreeWithLayer[] => {
  const seenAtLayer: number[] = [];
  return sortedTrees.filter(({ layer }) => {
    if (seenAtLayer[layer] === undefined) seenAtLayer[layer] = 0;
    seenAtLayer[layer]++;

    return (
      seenAtLayer[layer] < (layer + 1) * MAX_TREE_MULTIPLIER_PER_LAYER_LIMIT
    );
  });
};

// Remove trees according to some heuristics to ensure the forest is not too crowded
export const prune = (trees: TreeWithLayer[]): TreeWithLayer[] => {
  const filteredTrees = SHOW_DEAD_TREES
    ? trees
    : trees.filter(({ tree, layer }) => !isDeadTree(tree) || layer === 0);
  const sortedTrees = filteredTrees.sort(compareTrees);
  const totalSubset = sortedTrees.slice(0, MAX_TREE_TOTAL_LIMIT);
  const layerBasedTotalSubset = filterByLayer(totalSubset);

  console.log("Before prune", trees);
  console.log("Sorted", sortedTrees);
  console.log("After prune", layerBasedTotalSubset);

  return layerBasedTotalSubset;
};
