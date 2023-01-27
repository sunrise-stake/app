import { PublicKey } from "@solana/web3.js";

export interface BlazeState {
  pool: PublicKey;
  bsolMint: PublicKey;
  validatorList: PublicKey;
  reserveAccount: PublicKey;
  managerAccount: PublicKey;
  feesDepot: PublicKey;
  withdrawAuthority: PublicKey;
  depositAuthority: PublicKey;
}
