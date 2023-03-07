import { type CSSProperties, type FC } from "react";
import { type TreeComponent } from "../../../forest/utils";
import { Island } from "./Island";
import { TreeImage } from "./TreeImage";

// Use this key to determine the level of each tree (max 3 trees)
// 1: 1 0 0
// 2: 2 0 0
// 3: 2 1 0
// 4: 3 1 1
// 5: 3 2 1
// 6: 3 2 2
// 7: 3 3 2
// 8: 3 3 3
const firstTreeLevel = (level: number): number =>
  level === 1 ? 1 : level === 2 || level === 3 ? 2 : 3;
const secondTreeLevel = (level: number): number =>
  level < 3
    ? 0
    : level === 3 || level === 4
    ? 1
    : level === 5 || level === 6
    ? 2
    : 3;
const thirdTreeLevel = (level: number): number =>
  level < 4
    ? 0
    : level === 4 || level === 5
    ? 1
    : level === 6 || level === 7
    ? 2
    : 3;

const left = (index: number, total: number): string => {
  if (total === 1) {
    return "40px";
  }
  if (total === 2) {
    return index === 0 ? "60px" : "35px";
  }
  if (total === 3) {
    return index === 0 ? "50px" : index === 1 ? "40px" : "180px";
  }
  return "0px";
};

const bottom = (index: number, total: number): string => {
  if (total === 1) {
    return "80px";
  }
  if (total === 2) {
    return index === 0 ? "70px" : "70px";
  }
  if (total === 3) {
    return index === 0 ? "80px" : index === 1 ? "60px" : "70px";
  }
  return "0px";
};

const width = (index: number, total: number): string => {
  if (total === 1) {
    return "200px";
  }
  if (total === 2) {
    return index === 0 ? "200px" : "100px";
  }
  if (total === 3) {
    return index === 0 ? "200px" : index === 1 ? "120px" : "60px";
  }
  return "0px";
};

export const DynamicTree: FC<{
  details: TreeComponent;
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
  variant?: "sm" | "md";
}> = ({ details, style = {}, onClick, className = "", variant = "md" }) => {
  const { level, species } = details.metadata.type;

  console.log("MY TREE", details.metadata);

  const treeImages = [];
  const treeLevels = [
    firstTreeLevel(level),
    secondTreeLevel(level),
    thirdTreeLevel(level),
  ];

  treeImages.push(
    level > 0 ? `TREE_0${species}-0${treeLevels[0]}.png` : "_MULCHBAG.png"
  );
  if (treeLevels[1] > 0) {
    treeImages.push(`TREE_0${species}-0${treeLevels[1]}.png`);
  }
  if (treeLevels[2] > 0) {
    treeImages.push(`TREE_0${species}-0${treeLevels[2]}.png`);
  }

  const components = treeImages.map((image, index) => {
    return (
      <TreeImage
        key={index}
        src={image}
        style={
          variant === "sm"
            ? {
                position: "absolute",
                bottom: "90px",
                height: "60px",
              }
            : {
                position: "absolute",
                bottom: bottom(index, treeImages.length),
                left: left(index, treeImages.length),
                width: width(index, treeImages.length),
              }
        }
      />
    );
  });

  return (
    <div onClick={onClick} className={className} style={style}>
      <Island
        className={
          variant === "sm" ? "w-[100px] h-[100px]" : "w-[300px] h-[300px]"
        }
      >
        {components}
      </Island>
    </div>
  );
};
