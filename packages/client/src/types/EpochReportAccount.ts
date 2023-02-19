import type BN from "bn.js";

export interface EpochReportAccount {
  epoch: BN;
  tickets: BN;
  totalOrderedLamports: BN;
}
