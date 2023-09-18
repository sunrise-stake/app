import { type PublicKey } from "@solana/web3.js";

export interface BalanceDetails {
  address: PublicKey;
  balance: number;
  start: Date;
  end: Date;
}

export interface RawBalanceDetails {
  address: string;
  balance: number;
  start: string;
  end: string;
}

export type RawNeighbourEntry = RawBalanceDetails & {
  sender: string;
  recipient: string;
};

export type NeighbourEntry = BalanceDetails & {
  sender: PublicKey;
  recipient: PublicKey;
};

export interface NeighbourResult {
  senderResult: NeighbourEntry[];
  recipientResult: NeighbourEntry[];
}

export interface RawNeighbourResult {
  senderResult: RawNeighbourEntry[];
  recipientResult: RawNeighbourEntry[];
}

export interface RawGetNeighboursResponse {
  neighbours: RawNeighbourResult;
  firstTransfer: string;
  lastTransfer: string;
}

export interface GetNeighboursResponse {
  neighbours: NeighbourResult;
  firstTransfer: Date | null;
  lastTransfer: Date | null;
}

export type ParentRelationship = "PARENT_IS_SENDER" | "PARENT_IS_RECIPIENT";

export interface TreeNode {
  address: PublicKey;
  balance: number;
  startDate: Date;
  mostRecentTransfer: Date;
  parents: TreeNode[];
  children: Array<{
    tree: TreeNode;
    relationship: ParentRelationship;
    relationshipStartDate: Date;
  }>;
}
