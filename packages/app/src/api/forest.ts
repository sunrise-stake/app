import { type Connection, type PublicKey } from "@solana/web3.js";
import { settledPromises } from "../common/utils";
import {
  type Forest,
  type ForestAction,
  type Transfer,
  type TreeNode,
  type TreeNodeCache,
} from "./types";
import { getAccountMints, getAccountTransfers } from "./db";
import {
  earliest,
  filterFirstTransfersForSenderAndRecipient,
  getGsolBalance,
  getLockedBalance,
  getTotals,
  removeDuplicates,
  mintsToSelf,
  mintsWithRecipientsAsTransfers,
} from "./util";
import { type SunriseClientWrapper } from "../common/sunriseClientWrapper";

export const MAX_FOREST_DEPTH = 2; // the number of levels of tree neighbours to fetch and show

export class ForestService {
  private cache: TreeNodeCache;
  constructor(
    private readonly connection: Connection,
    private readonly client: SunriseClientWrapper
  ) {
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

  private getFromCache(address: PublicKey): Promise<TreeNode> | undefined {
    const cached = this.cache[address.toBase58()];
    if (cached === undefined) return undefined;
    return cached;
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

  private async loadTree(
    address: PublicKey,
    depth: number,
    parent?: TreeNode["parent"]
  ): Promise<TreeNode> {
    console.log("getting tree", address.toBase58(), depth, parent);
    const [currentBalance, lockedBalance, mints, transfers] = await Promise.all(
      [
        getGsolBalance(address, this.connection),
        getLockedBalance(this.client.internal(), address),
        getAccountMints(address),
        getAccountTransfers(address),
      ]
    );

    // get all transfers including gsol minted directly into a recipient's account
    const enrichedTransfers = [
      ...transfers,
      ...mintsWithRecipientsAsTransfers(mints),
    ];
    const filteredMints = mintsToSelf(mints);
    const received = enrichedTransfers.filter((t) =>
      t.recipient.equals(address)
    );
    const sent = enrichedTransfers.filter((t) => t.sender.equals(address));
    const totals = getTotals(
      currentBalance,
      lockedBalance,
      filteredMints,
      received,
      sent
    );
    const startDate = earliest([...mints, ...transfers]);

    return {
      address,
      mints: filteredMints,
      sent,
      received,
      totals,
      startDate,
      parent,
    };
  }

  private async getTree(
    address: PublicKey,
    depth: number,
    parent?: TreeNode["parent"]
  ): Promise<TreeNode> {
    if (depth < 0) throw new Error("Depth must be greater than or equal to 0");
    if (depth > MAX_FOREST_DEPTH)
      throw new Error(`Depth must be less than ${MAX_FOREST_DEPTH}`);

    // we cache the promises, not the results, to avoid sending multiple requests
    const cachedPromise = this.getFromCache(address);
    if (cachedPromise !== undefined) {
      return cachedPromise;
    } else {
      const promise = this.loadTree(address, depth, parent);
      this.updateCache({
        type: "SET",
        payload: { key: address.toBase58(), value: promise },
      });
      return promise;
    }
  }

  /**
   * Get the forest for a given wallet.
   *
   * @param address The wallet for the main tree in the forest
   * @param depth The amount of neighbours to follow
   * @param parent The parent for this root tree in a wider forest if any
   * @param reloadTree (Default false) If true, clear the cache for the root tree only before loading
   */
  public async getForest(
    address: PublicKey,
    depth: number = MAX_FOREST_DEPTH,
    parent?: TreeNode["parent"],
    reloadTree: boolean = false
  ): Promise<Forest> {
    if (reloadTree)
      this.updateCache({
        type: "REMOVE",
        payload: { key: address.toBase58() },
      });
    const treeNode = await this.getTree(address, depth, parent);

    // recursion happens here:
    const neighbours = await this.getNeighbours(
      filterFirstTransfersForSenderAndRecipient(treeNode.sent),
      filterFirstTransfersForSenderAndRecipient(treeNode.received),
      depth - 1,
      treeNode
    );

    return removeDuplicates({
      tree: treeNode,
      neighbours,
    });
  }
}
