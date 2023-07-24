import { type Connection, type PublicKey } from "@solana/web3.js";
import { type ParentRelationship, type TreeNode } from "./types";
import { getNeighbours } from "./db";
import { getGsolBalance, getLockedBalance } from "./util";
import { type SunriseClientWrapper } from "../common/sunriseClientWrapper";

export const MAX_FOREST_DEPTH = 2; // the number of levels of tree neighbours to fetch and show

export class ForestService {
  constructor(
    private readonly connection: Connection,
    private readonly client: SunriseClientWrapper
  ) {}

  public async getForest(
    address: PublicKey,
    depth: number = MAX_FOREST_DEPTH
  ): Promise<TreeNode> {
    const pushChild = (
      parent: TreeNode,
      child: TreeNode,
      relationship: ParentRelationship,
      relationshipStartDate: Date
    ): void => {
      const existing = parent.children.find((c) =>
        c.tree.address.equals(child.address)
      );
      if (!existing) {
        parent.children.push({
          tree: child,
          relationship,
          relationshipStartDate,
        });
      }
      if (!child.parents.includes(parent)) child.parents.push(parent);
    };

    const { firstTransfer, lastTransfer, neighbours } = await getNeighbours(
      address,
      depth
    );
    const [currentBalance, lockedBalance] = await Promise.all([
      getGsolBalance(address, this.connection),
      getLockedBalance(this.client.internal(), address),
    ]);

    const treeNodeLookup = new Map<string, TreeNode>();

    const parentTreeNode = {
      address,
      balance: currentBalance + lockedBalance,
      startDate: firstTransfer,
      mostRecentTransfer: lastTransfer,
      parents: [],
      children: [],
    };
    treeNodeLookup.set(address.toString(), parentTreeNode);
    [...neighbours.senderResult, ...neighbours.recipientResult].forEach(
      (entry) => {
        const foundNode = treeNodeLookup.get(entry.address.toString());
        if (!foundNode)
          treeNodeLookup.set(entry.address.toString(), {
            address: entry.address,
            balance: entry.balance,
            parents: [],
            children: [],
            mostRecentTransfer: entry.end,
            startDate: entry.start,
          });
      }
    );

    neighbours.senderResult.forEach((entry) => {
      const foundNode = treeNodeLookup.get(entry.address.toString());
      if (!foundNode) return;
      const senderNode = treeNodeLookup.get(entry.sender.toString());
      if (!senderNode) return;
      pushChild(foundNode, senderNode, "PARENT_IS_RECIPIENT", entry.start);
      pushChild(senderNode, foundNode, "PARENT_IS_SENDER", entry.start);
    });

    neighbours.recipientResult.forEach((entry) => {
      const foundNode = treeNodeLookup.get(entry.address.toString());
      if (!foundNode) return;
      const recipientNode = treeNodeLookup.get(entry.recipient.toString());
      if (!recipientNode) return;
      pushChild(foundNode, recipientNode, "PARENT_IS_SENDER", entry.start);
      pushChild(recipientNode, foundNode, "PARENT_IS_RECIPIENT", entry.start);
    });

    return parentTreeNode;
  }
}
