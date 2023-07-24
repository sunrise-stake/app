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
  firstTransfer: Date;
  lastTransfer: Date;
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
