import { type PublicKey } from "@solana/web3.js";

export interface MintResponse {
  timestamp: string;
  sender?: string; // the wallet that pays for the mint (assume = the recipient if missing)
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
  sender?: PublicKey; // the wallet that pays for the mint (assume = the recipient if missing)
  recipient: PublicKey; // the wallet that receives the minted gSOL
  amount: number;
}

export interface Transfer {
  timestamp: Date;
  sender: PublicKey;
  recipient: PublicKey;
  amount: number;
}

export type ParentRelationship = "PARENT_IS_SENDER" | "PARENT_IS_RECIPIENT";

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
    relationship: ParentRelationship;
    relationshipStartDate: Date;
  };
}

// A forest is a tree with neighbours
export interface Forest {
  tree: TreeNode;
  neighbours: Forest[];
}

export type TreeNodeCache = Record<string, Promise<TreeNode>>;
export type ForestAction =
  | {
      type: "SET";
      payload: { key: string; value: Promise<TreeNode> };
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
