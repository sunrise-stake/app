import { type PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

export interface LockAccount {
  address: PublicKey;
  stateAddress: PublicKey;
  authority: PublicKey;
  lockTokenAccount: PublicKey;

  startEpoch: BN;

  sunriseYieldAtStart: BN;
}
