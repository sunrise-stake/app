import { type Connection, type PublicKey } from "@solana/web3.js";
import { settledPromises } from "../common/utils";
import {
  type Forest,
  type ForestAction,
  type Transfer,
  type TreeNode,
  type TreeNodeCache,
} from "./types";
import { getAccountMints, getAccountReceipts, getAccountSendings } from "./db";
import {
  earliest,
  filterFirstTransfersForSenderAndRecipient,
  getTotals,
  memoisedGetGsolBalance,
  prune,
} from "./util";

export const MAX_FOREST_DEPTH = 2; // the number of levels of tree neighbours to fetch and show

export class ForestService {
  private cache: TreeNodeCache;
  constructor(private readonly connection: Connection) {
    this.cache = {};
  }

  private updateCache(action: ForestAction): void {
    const treeNodeCacheReducer = (
      state: TreeNodeCache,
      action: ForestAction
    ): TreeNodeCache => {
      switch (action.type) {
        case "SET":
          return { ...state, [action.payload.key]: action.payload.value };
        case "REMOVE": {
          const { [action.payload.key]: _, ...rest } = state;
          return rest;
        }
        default:
          return state;
      }
    };

    this.cache = treeNodeCacheReducer(this.cache, action);
  }

  public async getNeighbours(
    sendings: Transfer[],
    receipts: Transfer[],
    depth: number,
    parent: TreeNode
  ): Promise<Forest[]> {
    if (depth < 0) return [];

    const sendingNeighboursPromise = Promise.allSettled(
      sendings.map(async (sending) =>
        this.getForest(sending.recipient, depth, {
          tree: parent,
          relationship: "PARENT_IS_SENDER",
          relationshipStartDate: sending.timestamp,
        })
      )
    );

    const receiptNeighboursPromise = Promise.allSettled(
      receipts.map(async (receipt) =>
        this.getForest(receipt.sender, depth, {
          tree: parent,
          relationship: "PARENT_IS_RECIPIENT",
          relationshipStartDate: receipt.timestamp,
        })
      )
    );

    // TODO deal with rejected promises
    const sendingNeighbours = settledPromises(await sendingNeighboursPromise);
    const receiptNeighbours = settledPromises(await receiptNeighboursPromise);

    return [...sendingNeighbours, ...receiptNeighbours];
  }

  private async getTree(
    address: PublicKey,
    depth: number,
    parent?: TreeNode["parent"]
  ): Promise<TreeNode> {
    if (depth < 0) throw new Error("Depth must be greater than or equal to 0");
    if (depth > MAX_FOREST_DEPTH)
      throw new Error(`Depth must be less than ${MAX_FOREST_DEPTH}`);

    const cached: TreeNode | undefined = this.cache[address.toBase58()];
    if (cached !== undefined) {
      console.log("using cached tree", address.toBase58(), depth, parent);
      return cached;
    }

    console.log("getting tree", address.toBase58(), depth, parent);
    const [currentBalance, mints, received, sent] = await Promise.all([
      memoisedGetGsolBalance(address, this.connection),
      getAccountMints(address),
      getAccountReceipts(address),
      getAccountSendings(address),
    ]);
    const totals = getTotals(currentBalance, mints, received, sent);
    const startDate = earliest([...mints, ...received, ...sent]);

    const treeNode: TreeNode = {
      address,
      mints,
      sent,
      received,
      totals,
      startDate,
      parent,
    };
    this.updateCache({
      type: "SET",
      payload: { key: address.toBase58(), value: treeNode },
    });

    return treeNode;
  }

  // Get the forest for an address.
  public async getForest(
    address: PublicKey,
    depth: number = MAX_FOREST_DEPTH,
    parent?: TreeNode["parent"]
  ): Promise<Forest> {
    const treeNode = await this.getTree(address, depth, parent);

    // recursion happens here:
    const neighbours = await this.getNeighbours(
      filterFirstTransfersForSenderAndRecipient(treeNode.sent),
      filterFirstTransfersForSenderAndRecipient(treeNode.received),
      depth - 1,
      treeNode
    );

    return prune({
      tree: treeNode,
      neighbours,
    });
  }
}
