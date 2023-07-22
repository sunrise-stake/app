import clx from "classnames";
import React, {
  type CSSProperties,
  type FC,
  forwardRef,
  type ForwardRefRenderFunction,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { intermediaries, type TreeComponent } from "./utils";
import { DynamicTree } from "../common/components/tree/DynamicTree";
import { IoChevronForwardOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { useForest } from "../common/context/forestContext";
import { ProfileBox } from "../common/components/profile/ProfileBox";
import { type PublicKey } from "@solana/web3.js";
import { useZenMode } from "../common/context/ZenModeContext";
import { useHelp } from "../common/context/HelpContext";
import { AppRoute } from "../Routes";
import { ForestLink } from "./ForestLink";
import { useWallet } from "@solana/wallet-adapter-react";
import { type ParentRelationship, type TreeNodeNew } from "../api/types";

const ForestTree: FC<{ details: TreeComponent; style?: CSSProperties }> = ({
  details,
}) => {
  const grayscale = details.metadata.type.translucent
    ? 100
    : details.metadata.layer * 20;
  return (
    <DynamicTree
      details={details}
      style={{
        filter: `blur(${
          details.metadata.layer * 2
        }px) grayscale(${grayscale}%)`,
      }}
    />
  );
};

const PerspectiveComponent: FC<{
  details: TreeComponent;
  style?: CSSProperties;
  children: ReactNode;
  locus: { x: number; y: number; z: number };
}> = ({ details, style = {}, locus, children }) => (
  <li
    className="tree group"
    style={{
      display: "block",
      position: "absolute",
      transform: `translate3d(${details.translate.x + locus.x}px, ${
        details.translate.y + locus.y
      }px, ${details.translate.z + locus.z}px)`,
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

const getIntermediaries = (
  treeNode: TreeNodeNew,
  myTree: TreeNodeNew
): PublicKey[] => {
  const path = intermediaries(treeNode, myTree);
  if (path) return path.map((p) => p.address);
  return [];
};

const relationshipWithTree = (
  treeNode: TreeNodeNew,
  myTree: TreeNodeNew
): ParentRelationship | undefined => {
  const child = myTree.children.find((c) =>
    c.tree.address.equals(treeNode.address)
  );

  if (child === undefined) return undefined;

  return child.relationship;
};

const _ForestApp: ForwardRefRenderFunction<
  HTMLDivElement,
  { className?: string; active?: boolean } & React.HTMLAttributes<HTMLElement>
> = ({ className, active = false, ...rest }, ref) => {
  const [zenMode, updateZenMode] = useZenMode();
  const { currentHelpRoute } = useHelp();
  useEffect(() => {
    if (currentHelpRoute !== AppRoute.Forest) return; // we are not on the forest page, so don't update zen mode
    updateZenMode({
      ...zenMode,
      showHelpButton: true,
      showExternalLinks: false,
      showWallet: false,
    });
  }, [active, currentHelpRoute]);

  const navigate = useNavigate();
  const wallet = useWallet();
  useEffect(() => {
    if (!wallet.connected && active) navigate("/");
  }, [active, wallet.connected]);

  const { myTree, neighbours } = useForest();
  // use this to position the entire forest in space
  const [locus, setLocus] = useState({
    x: 0,
    y: -100,
    z: window.innerWidth / 4 - 450,
  });
  // this is a hack to ensure the forest resizes correctly when e.g. the viewport is changed
  // there is almost certainly a better CSS way to do this
  useEffect(() => {
    setLocus({
      x: 0,
      y: -100, // window.innerHeight / 4 - 300,
      z: window.innerWidth / 4 - 450,
    });
  }, [window.innerWidth]);

  console.log("my tree", myTree);
  console.log("neighbours", neighbours);

  if (!myTree) return <></>;

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
        <PerspectiveComponent details={myTree} locus={locus}>
          <ForestTree details={myTree} />
        </PerspectiveComponent>
        {neighbours?.map((tree) => (
          <PerspectiveComponent
            key={`${tree.address.toBase58()}-${tree.metadata.layer}`}
            details={tree}
            locus={locus}
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
        <PerspectiveComponent
          details={myTree}
          style={{ top: "200px", width: "350px", left: "-75px" }}
          locus={locus}
        >
          <input type="checkbox" className="tree-checker opacity-0" />
          <ProfileBox address={myTree.address} />
        </PerspectiveComponent>
        {neighbours?.map((tree) => (
          <PerspectiveComponent
            key={`${tree.address.toBase58()}-${tree.metadata.layer}`}
            details={tree}
            style={{ top: "200px" }}
            locus={locus}
          >
            <ProfileBox
              address={tree.address}
              relationship={relationshipWithTree(
                tree.metadata.node,
                myTree.metadata.node
              )}
              intermediaries={getIntermediaries(
                tree.metadata.node,
                myTree.metadata.node
              )}
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
      {currentHelpRoute === AppRoute.Forest && (
        <div className="z-10 fixed top-4 left-4">
          <ForestLink />
        </div>
      )}
    </div>
  );
};

const ForestApp = forwardRef(_ForestApp);

export { ForestApp };
