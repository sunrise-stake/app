import { type Connection, type PublicKey } from "@solana/web3.js";
import { type TreeNodeCache, type TreeNodeNew } from "./types";
import { getNeighbours } from "./db";
import { getGsolBalance, getLockedBalance, isRecipient } from "./util";
import { type SunriseClientWrapper } from "../common/sunriseClientWrapper";

export const MAX_FOREST_DEPTH = 2; // the number of levels of tree neighbours to fetch and show

export class ForestService {
  private readonly cache: TreeNodeCache;

  constructor(
    private readonly connection: Connection,
    private readonly client: SunriseClientWrapper
  ) {
    this.cache = {};
  }

  public async getForest(
    address: PublicKey,
    depth: number = MAX_FOREST_DEPTH
  ): Promise<TreeNodeNew> {
    const { firstTransfer, lastTransfer, neighbours } = await getNeighbours(
      address,
      depth
    );
    const [currentBalance, lockedBalance] = await Promise.all([
      getGsolBalance(address, this.connection),
      getLockedBalance(this.client.internal(), address),
    ]);

    type AugmentedTreeNode = TreeNodeNew & {
      degree: number;
      senders: PublicKey[];
      recipients: PublicKey[];
    };
    const treeNodeLookup = new Map<string, AugmentedTreeNode>();

    const parentTreeNode: AugmentedTreeNode = {
      address,
      balance: currentBalance + lockedBalance,
      startDate: firstTransfer,
      mostRecentTransfer: lastTransfer,
      parents: [],
      children: [],
      degree: 0,
      senders: [],
      recipients: [],
    };
    treeNodeLookup.set(address.toString(), parentTreeNode);

    // This is inefficient - TODO replace
    const setChildren = (tree: AugmentedTreeNode): void => {
      tree.senders.forEach((parent) => {
        const parentNode = treeNodeLookup.get(parent.toString());
        if (!parentNode) return;
        parentNode.children.push({
          tree,
          relationship: "PARENT_IS_RECIPIENT",
          relationshipStartDate: tree.startDate, // TODO this is wrong - probably we don't need it
        });
        tree.parents.push(parentNode);
      });
      tree.recipients.forEach((parent) => {
        const parentNode = treeNodeLookup.get(parent.toString());
        if (!parentNode) return;
        parentNode.children.push({
          tree,
          relationship: "PARENT_IS_SENDER",
          relationshipStartDate: tree.startDate, // TODO this is wrong - probably we don't need it
        });
        tree.parents.push(parentNode);
      });
    };

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
            degree: entry.degree,
            senders: isRecipient(entry) ? entry.senders : [],
            recipients: isRecipient(entry) ? [] : entry.recipients,
          });
      }
    );

    treeNodeLookup.forEach(setChildren);

    return parentTreeNode;
  }
}
