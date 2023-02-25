import { type Forest } from "../api/forest";
import { PublicKey } from "@solana/web3.js";

interface Translation {
  x: number;
  y: number;
  z: number;
}

export interface TreeComponent {
  address: PublicKey;
  translate: Translation;
  metadata: {
    level: number;
  };
}
const calculateTranslation = (
  level: number,
  totalInLevel: number,
  indexInLevel: number
): Translation => {
  // the radius is the distance from the source tree to the neighbours,
  // or the difference between each level (in pixels)
  const radius = 300;

  // the height is the vertical distance between each level (in pixels)
  // if zero, the trees are placed on a flat plane, and will appear behind each other
  // to avoid obscuring trees, we set a positive value here, so neighbours appear slight higher than the source tree
  const height = 50;

  // the part of the circle along which neighbours are placed - in radians
  // 2PI = trees are fully surrounding the source tree
  // PI = trees are placed on a semi-circle behind the source tree
  const arc = Math.PI * 0.8;

  // spreadSegment is the angle between each neighbour
  // if there is only one neighbour, it is placed in the middle of the arc (and spreadSegment is not used)
  const spreadSegment = totalInLevel > 1 ? arc / (totalInLevel - 1) : arc;

  // the starting angle is the angle at which the first neighbour is placed
  // the angle is measured from the positive x-axis, so it should be 90 degrees minus half the arc
  // if the arc is a semi-circle, this will be 0 degrees, which is directly to the right of the source tree
  const startingAngle = Math.PI / 2 - arc / 2;

  // now we have all the values, we can calculate the position of each neighbour

  // the angle for the neighbour is the start of the arc, plus the spreadSegment multiplied by the index of the neighbour
  const angle = startingAngle + indexInLevel * spreadSegment;
  // we need to make sure the angle is between 0 and 2PI because the Math.sin and Math.cos functions only work with positive values
  const normalisedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

  const x = Math.floor(Math.cos(normalisedAngle) * radius * level);
  const y = Math.floor(-Math.sin(normalisedAngle) * height * level);
  const z = Math.floor(-Math.sin(normalisedAngle) * radius * level);
  console.log(
    `${indexInLevel}: arc ${arc} - spreadSegment ${spreadSegment} - angle ${angle} (${normalisedAngle}) - x: ${x}, y: ${y}, z: ${z}`
  );

  return { x, y, z };
};

export const forestToComponents = (forest: Forest): TreeComponent[] => {
  const toComponent = (
    address: PublicKey,
    level: number,
    indexInLevel: number,
    totalInLevel: number
  ): TreeComponent => ({
    address,
    translate: calculateTranslation(level, totalInLevel, indexInLevel),
    metadata: {
      level,
    },
  });

  const totalForLevel = (level: number): number =>
    Object.entries(forest.neighbors[level]).length;

  // add a component for each neighbour
  return forest.neighbors.flatMap((trees, level) =>
    Object.entries(trees).map(([address, neighbor], indexInLevel) =>
      toComponent(
        new PublicKey(address),
        level + 1,
        indexInLevel,
        totalForLevel(level)
      )
    )
  );
};
