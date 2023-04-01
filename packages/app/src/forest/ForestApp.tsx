import { type PublicKey } from "@solana/web3.js";
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
import { IoChevronForwardOutline } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AppRoute } from "../Routes";
import { type TreeNode } from "../api/types";
import { DynamicTree, ProfileBox } from "../common/components";
import { useForest, useHelp, useZenMode } from "../common/context";
import { useSunriseStore } from "../common/store/useSunriseStore";
import { ForestLink } from "./ForestLink";
import { type TreeComponent } from "./utils";

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

const getIntermediaries = (treeNode: TreeNode): PublicKey[] => {
  const parent = treeNode.parent?.tree;

  // skip the last tree (one with no parent) as this is not an intermediary, it is the current logged-in user
  if (parent === undefined || parent.parent === undefined) return [];

  return [parent.address, ...getIntermediaries(parent)];
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

  const location = useLocation();
  const navigate = useNavigate();
  const wallet = useSunriseStore((state) => state.wallet);
  useEffect(() => {
    if (!wallet.connected && location.state?.address === undefined)
      navigate("/");
  }, [wallet.connected]);

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
          <PerspectiveComponent details={myTree} locus={locus}>
            <ForestTree details={myTree} />
          </PerspectiveComponent>
        )}
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
        {myTree && (
          <PerspectiveComponent
            details={myTree}
            style={{ top: "200px", width: "350px", left: "-75px" }}
            locus={locus}
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
            locus={locus}
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
