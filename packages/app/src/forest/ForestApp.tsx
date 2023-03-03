import clx from "classnames";
import { type CSSProperties, type FC } from "react";
import { useTrees } from "./hooks/useTrees";
import { type TreeComponent } from "./utils";
import { toShortBase58 } from "../common/utils";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { forwardRef, type ForwardRefRenderFunction } from "react";

const Tree: FC<{ details: TreeComponent; style?: CSSProperties }> = ({
  details,
  style = {},
}) => (
  <li
    className="tree"
    style={{
      display: "block",
      position: "absolute",
      transform: `translate3d(${details.translate.x}px, ${details.translate.y}px, ${details.translate.z}px)`,
      filter: `blur(${details.metadata.layer * 2}px) grayscale(40%)`,
      width: "300px",
      left: "-50px",
      animationDelay: `${details.metadata.layer}s`,
      ...style,
    }}
  >
    <DynamicTree details={details} />
    <p>{toShortBase58(details.address)}</p>
  </li>
);


const _ForestApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string } & React.HTMLAttributes<HTMLElement>
> = ({ className, ...rest }, ref) => {
  const { myTree, neighbours } = useTrees();
  return (
    <div
      className={clx("flex justify-center items-center", className)}
      {...rest}
      ref={ref}
    >
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

const ForestApp = forwardRef(_ForestApp);

export { ForestApp };
