import clx from "classnames";
import {
  type CSSProperties,
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
  type ReactNode,
} from "react";
import { type TreeComponent } from "./utils";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { IoChevronForwardOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useForest } from "../common/context/forestContext";
import { ProfileBox } from "../common/components/profile/ProfileBox";
import { type TreeNode } from "../api/types";
import { type PublicKey } from "@solana/web3.js";

const ForestTree: FC<{ details: TreeComponent; style?: CSSProperties }> = ({
  details,
}) => (
  <DynamicTree
    details={details}
    style={{
      filter: `blur(${details.metadata.layer * 2}px) grayscale(${
        details.metadata.layer * 20
      }%)`,
    }}
  />
);

const PerspectiveComponent: FC<{
  details: TreeComponent;
  style?: CSSProperties;
  children: ReactNode;
}> = ({ details, style = {}, children }) => (
  <li
    className="tree group"
    style={{
      display: "block",
      position: "absolute",
      transform: `translate3d(${details.translate.x}px, ${details.translate.y}px, ${details.translate.z}px)`,
      width: "300px",
      left: "-50px",
      animationDelay: `${details.metadata.layer}s`,
      ...style,
    }}
  >
    <div
      className="ForestTree"
      style={{
        animationDelay: `${Math.random() * 2}s`,
      }}
    >
      {children}
    </div>
  </li>
);

const getIntermediaries = (treeNode: TreeNode): PublicKey[] => {
  const parent = treeNode.parent?.tree;

  // skip the last tree (one with no parent) as this is not an intermediary, it is the current logged-in user
  if (parent === undefined || parent.parent === undefined) return [];

  return [parent.address, ...getIntermediaries(parent)];
};

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
      {/* TREES */}
      <ul
        style={{
          listStyle: "none",
          perspective: "200px",
          transformStyle: "preserve-3d",
        }}
      >
        {myTree && (
          <PerspectiveComponent details={myTree}>
            <ForestTree details={myTree} />
          </PerspectiveComponent>
        )}
        {neighbours?.map((tree) => (
          <PerspectiveComponent
            key={`${tree.address.toBase58()}-${tree.metadata.layer}`}
            details={tree}
          >
            <ForestTree details={tree} />
          </PerspectiveComponent>
        ))}
      </ul>
      {/* PROFILE BOXES */}
      <ul
        style={{
          listStyle: "none",
          perspective: "200px",
        }}
      >
        {myTree && (
          <PerspectiveComponent
            details={myTree}
            style={{ top: "200px", width: "350px", left: "-75px" }}
          >
            <input type="checkbox" className="tree-checker opacity-0" />
            <ProfileBox address={myTree.address} />
          </PerspectiveComponent>
        )}
        {neighbours?.map((tree) => (
          <PerspectiveComponent
            key={`${tree.address.toBase58()}-${tree.metadata.layer}`}
            details={tree}
            style={{ top: "200px" }}
          >
            <ProfileBox
              address={tree.address}
              relationship={tree.metadata.node.parent?.relationship}
              intermediaries={getIntermediaries(tree.metadata.node)}
            />
          </PerspectiveComponent>
        ))}
      </ul>
      <div className="absolute top-0 right-0 mt-4">
        <div className="container">
          <Link to="/" className="flex items-center text-green">
            <div className="flex items-center nowrap">
              <IoChevronForwardOutline className="inline" size={48} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

const ForestApp = forwardRef(_ForestApp);

export { ForestApp };
