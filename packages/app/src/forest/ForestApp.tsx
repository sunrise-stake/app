import clx from "classnames";
import {
  type CSSProperties,
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
} from "react";
import { type TreeComponent } from "./utils";
import { toShortBase58 } from "../common/utils";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { IoChevronBackOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useForest } from "../common/context/forestContext";

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
  const { myTree, neighbours } = useForest();
  return (
    <div
      className={clx("relative flex justify-center items-center", className)}
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
          <Tree
            key={`${tree.address.toBase58()}-${tree.metadata.layer}`}
            details={tree}
          />
        ))}
      </ul>
      <div className="absolute top-0 left-0 mt-4">
        <div className="container">
          <Link to="/" className="flex items-center text-green">
            <div className="flex items-center nowrap">
              <IoChevronBackOutline className="inline" size={24} />
              <span>Back</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

const ForestApp = forwardRef(_ForestApp);

export { ForestApp };
