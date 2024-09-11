import { type TreeNode } from "./types";
import { type Connection, PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  type SunriseStakeClient,
  toSol,
  ZERO_BALANCE,
} from "@sunrisestake/client";

export const isDeadTree = (tree: TreeNode): boolean => tree.balance === 0;

// TODO move this to the client and pass in a client instead of a connection
// also, create a service that listens to accounts and updates the state, rather than
// retrieving the state on every request
export const getGsolBalance = async (
  address: PublicKey,
  connection: Connection
): Promise<number> => {
  // TODO remove hard-coded gsol mint and get from the state
  const gsolMint = new PublicKey("gso1xA56hacfgTHTF4F7wN5r4jbnJsKh99vR595uybA");
  const tokenAccount = PublicKey.findProgramAddressSync(
    [address.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), gsolMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
  let balance;
  try {
    balance = await connection.getTokenAccountBalance(tokenAccount);
  } catch {
    balance = ZERO_BALANCE;
  }
  return balance.value.uiAmount ?? 0;
};

export const getLockedBalance = async (
  client: SunriseStakeClient,
  address: PublicKey
): Promise<number> => {
  const lockedBalanceLamports = await client.lockClient?.getLockedBalance(
    address
  );
  if (lockedBalanceLamports === undefined || lockedBalanceLamports === null)
    return 0;
  return toSol(lockedBalanceLamports);
};
