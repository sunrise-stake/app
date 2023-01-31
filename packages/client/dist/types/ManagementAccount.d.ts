import BN from "bn.js";
export interface ManagementAccount {
  epoch: BN;
  tickets: BN;
  totalOrderedLamports: BN;
}
