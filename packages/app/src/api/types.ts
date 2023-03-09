import { type PublicKey } from "@solana/web3.js";

export interface MintResponse {
  timestamp: string;
  recipient: string;
  amount: number;
}

export interface TransferResponse {
  timestamp: string;
  sender: string;
  recipient: string;
  amount: number;
}

export interface MongoResponse<T> {
  documents: T[];
}

export interface Mint {
  timestamp: Date;
  recipient: PublicKey;
  amount: number;
}

export interface Transfer {
  timestamp: Date;
  sender: PublicKey;
  recipient: PublicKey;
  amount: number;
}

// A treeNode is the representation of an account's balance and activity
// We call it TreeNode instead of Tree, because a "tree" in computer science
// is usually a collection of nodes, and we don't want to confuse the two.
export interface TreeNode {
  address: PublicKey;
  mints: Mint[];
  sent: Transfer[];
  received: Transfer[];
  totals: Totals;
  startDate: Date;
  parent?: {
    tree: TreeNode;
    relationship: "PARENT_IS_SENDER" | "PARENT_IS_RECIPIENT";
    relationshipStartDate: Date;
  };
}

// A forest is a tree with neighbours
export interface Forest {
  tree: TreeNode;
  neighbours: Forest[];
}

export type TreeNodeCache = Record<string, TreeNode>;
export type ForestAction =
  | {
      type: "SET";
      payload: { key: string; value: TreeNode };
    }
  | {
      type: "REMOVE";
      payload: { key: string };
    };

export interface Totals {
  currentBalance: number;
  amountMinted: number;
  amountReceived: number;
  amountSent: number;
  amountTotal: number;
  countMints: number;
  countReceipts: number;
  countSendings: number;
  uniqueSenders: PublicKey[];
  uniqueRecipients: PublicKey[];
}
