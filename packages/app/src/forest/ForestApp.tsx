import { type FC } from "react";
import { useTrees } from "./hooks/useTrees";
import { type TreeComponent } from "./utils";
import { toShortBase58 } from "../common/utils";

const Tree: FC<{ details: TreeComponent; style?: React.CSSProperties }> = ({
  details,
  style = {},
}) => (
  <li
    className="tree"
    style={{
      display: "block",
      position: "absolute",
      transform: `translate3d(${details.translate.x}px, ${details.translate.y}px, ${details.translate.z}px)`,
      filter: `blur(${details.metadata.level}px) grayscale(40%) brightness(1.5)`,
      width: "200px",
      animationDelay: `${details.metadata.level}s`,
      ...style,
    }}
  >
    <img
      src="https://cdn.pixabay.com/photo/2014/12/22/00/07/tree-576847__480.png"
      alt={details.address.toBase58()}
    />
    <p>{toShortBase58(details.address)}</p>
  </li>
);

const ForestApp: FC = () => {
  const { myTree, neighbours } = useTrees();

  return (
    <div className="container mx-auto flex justify-center items-center">
      <h2>Forest.</h2>
      <ul
        style={{
          listStyle: "none",
          perspective: "200px",
          transformStyle: "preserve-3d",
        }}
      >
        {myTree && <Tree details={myTree} />}
        {neighbours?.map((tree) => (
          <Tree key={tree.address.toBase58()} details={tree} />
        ))}
      </ul>
    </div>
  );
};

export { ForestApp };
