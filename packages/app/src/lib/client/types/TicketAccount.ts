import { MarinadeBorsh } from "@sunrisestake/marinade-ts-sdk";
import { PublicKey } from "@solana/web3.js";

export type TicketAccount = {
  address: PublicKey;
  stateAddress: PublicKey;
  marinadeTicketAccount: PublicKey;
  beneficiary: PublicKey;
} & MarinadeBorsh.TicketAccount;
