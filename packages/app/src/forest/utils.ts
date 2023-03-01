import { type Forest, type TreeNode } from "../api/forest";
import { type PublicKey } from "@solana/web3.js";

const IMAGE_COUNT = 1; // only one tree image per level and species at the moment

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
// const WEEK_IN_MS = 7 * DAY_IN_MS;
const MONTH_IN_MS = 30 * DAY_IN_MS;
// const YEAR_IN_MS = 365 * DAY_IN_MS;

enum Species {
  Oak = 0,
  Pine = 1,
  Maple = 2,
}

enum Level {
  Seedling = 0,
  Sapling = 1,
  Juvenile = 2,
  Mature = 3,
}

interface Translation {
  x: number;
  y: number;
  z: number;
}

interface TreeType {
  level: Level;
  species: Species;
  instance: number;
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
  // the radius is the distance from the source tree to the neighbours,
  // or the difference between each layer (in pixels)
  const radius = 300;

  // the height is the vertical distance between each layer (in pixels)
  // if zero, the trees are placed on a flat plane, and will appear behind each other
  // to avoid obscuring trees, we set a positive value here, so neighbours appear slight higher than the source tree
  const height = 50;

  // the part of the circle along which neighbours are placed - in radians
  // 2PI = trees are fully surrounding the source tree
  // PI = trees are placed on a semi-circle behind the source tree
  const arc = Math.PI * 0.8;

  // spreadSegment is the angle between each neighbour
  // if there is only one neighbour, it is placed in the middle of the arc (and spreadSegment is not used)
  const spreadSegment = totalInLayer > 1 ? arc / (totalInLayer - 1) : arc;

  // the starting angle is the angle at which the first neighbour is placed
  // the angle is measured from the positive x-axis, so it should be 90 degrees minus half the arc
  // if the arc is a semi-circle, this will be 0 degrees, which is directly to the right of the source tree
  const startingAngle = Math.PI / 2 - arc / 2;

  // now we have all the values, we can calculate the position of each neighbour

  // the angle for the neighbour is the start of the arc, plus the spreadSegment multiplied by the index of the neighbour
  const angle = startingAngle + indexInLayer * spreadSegment;
  // we need to make sure the angle is between 0 and 2PI because the Math.sin and Math.cos functions only work with positive values
  const normalisedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

  const x = Math.floor(Math.cos(normalisedAngle) * radius * layer);
  const y = Math.floor(-Math.sin(normalisedAngle) * height * layer);
  const z = Math.floor(-Math.sin(normalisedAngle) * radius * layer);
  console.log(
    `${indexInLayer}: arc ${arc} - spreadSegment ${spreadSegment} - angle ${angle} (${normalisedAngle}) - x: ${x}, y: ${y}, z: ${z}`
  );

  return { x, y, z };
};

// Converts a balance in lamports to a tree level
const balanceAndAgeToLevel = (balance: number, start: Date): Level => {
  if (start > new Date(Date.now() - 6 * HOUR_IN_MS)) {
    return Level.Seedling;
  } else if (start > new Date(Date.now() - 1 * DAY_IN_MS)) {
    // TODO extend these times later after testing is complete
    return Level.Sapling;
  } else if (start > new Date(Date.now() - 1 * MONTH_IN_MS)) {
    return Level.Juvenile;
  } else {
    return Level.Mature;
  }
};

const calculateTreeType = (tree: TreeNode): TreeType => {
  const instance = tree.address.toBuffer()[31] % IMAGE_COUNT;
  const species = tree.address.toBuffer()[30] % Object.values(Species).length;
  const level = balanceAndAgeToLevel(
    tree.totals.currentBalance,
    tree.startDate
  );
  return { instance, species, level };
};

const treeImageUri = (treeType: TreeType): string => {
  return `https://api.sunrisestake.com/assets/tree/Tree0${treeType.level}0${treeType.species}.png`;
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
  const recursiveForestToComponents = (
    forest: Forest,
    layer: number,
    indexInLayer: number,
    totalInLayer: number,
    existingComponents: TreeComponent[]
  ): void => {
    // add this tree
    console.log(
      "Adding tree ",
      forest.tree.address.toBase58(),
      "to layer:",
      layer,
      "at index: ",
      indexInLayer,
      "of",
      totalInLayer
    );
    existingComponents.push(
      treeNodeToComponent(forest.tree, layer, indexInLayer, totalInLayer)
    );

    // add a component for each neighbour
    forest.neighbours.forEach((neighbour, indexInLayer) => {
      recursiveForestToComponents(
        neighbour,
        layer + 1,
        indexInLayer,
        forest.neighbours.length,
        existingComponents
      );
    });
  };

  const components: TreeComponent[] = [];
  recursiveForestToComponents(forest, 0, 0, 1, components);
  return components;
};
