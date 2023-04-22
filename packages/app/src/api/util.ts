// Given a set of transfers, return the first transfer for each sender-recipient pair
import {
  type Forest,
  type Mint,
  type Totals,
  type Transfer,
  type TreeNode,
} from "./types";
import { addUp, memoise, mostRecent, round } from "../common/utils";
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

export const filterFirstTransfersForSenderAndRecipient = (
  transfers: Transfer[]
): Transfer[] => {
  const toKey = (transfer: Transfer): string =>
    `${transfer.sender.toString()}-${transfer.recipient.toString()}`;
  const firstTransfers: Record<string, Transfer> = {};
  transfers.forEach((transfer) => {
    const key = toKey(transfer);
    if (firstTransfers[key] === undefined) {
      firstTransfers[key] = transfer;
    } else if (
      transfer.timestamp.getTime() < firstTransfers[key].timestamp.getTime()
    ) {
      firstTransfers[key] = transfer;
    }
  });

  return Object.values(firstTransfers);
};

const isMintTransfer = (mint: Mint): mint is Required<Mint> =>
  mint.sender !== undefined && !mint.sender.equals(mint.recipient);

/**
 * Find all mints for which the recipient is not the sender and return them as transfers
 * This ensures that transferred gSOL and gSOL that is minted directly into someone else's account
 * are treated the same way
 */
export const mintsWithRecipientsAsTransfers = (mints: Mint[]): Transfer[] => {
  return mints.filter(isMintTransfer).map((mint) => ({
    amount: mint.amount,
    sender: mint.sender,
    recipient: mint.recipient,
    timestamp: mint.timestamp,
  }));
};
export const mintsToSelf = (mints: Mint[]): Mint[] =>
  mints.filter(
    (mint) => mint.sender === undefined || mint.sender.equals(mint.recipient)
  );

export const isDeadTree = (tree: TreeNode): boolean =>
  tree.totals.currentBalance === 0;

export const removeDuplicates = (forest: Forest): Forest => {
  const seen: string[] = [];
  // if a tree node is in the seen array, it's a duplicate, remove it.
  const dedupe = (forest: Forest): Forest | null => {
    if (seen.includes(forest.tree.address.toBase58())) return null;

    seen.push(forest.tree.address.toBase58());
    const prunedNeighbours = forest.neighbours
      .map(dedupe)
      .filter((n): n is Forest => n !== null);
    return { ...forest, neighbours: prunedNeighbours };
  };

  // the cast here is ok, because the seen array starts empty
  // so the root node will never be pruned
  return dedupe(forest) as Forest;
};

export const getMostRecentActivity = (tree: TreeNode): Date => {
  const mostRecentMint = mostRecent(tree.mints);
  const mostRecentSend = mostRecent(tree.sent);
  const mostRecentReceipt = mostRecent(tree.received);

  const timestamps: number[] = [
    mostRecentMint,
    mostRecentSend,
    mostRecentReceipt,
  ]
    .filter((x) => x !== undefined)
    .map((x) => x?.timestamp.getTime() as number);

  return new Date(Math.max(...timestamps));
};

export const getTotals = (
  currentBalance: number,
  lockedBalance: number,
  mints: Mint[],
  receipts: Transfer[],
  sendings: Transfer[]
): Totals => {
  const amountMinted = round(addUp("amount", mints));
  const amountReceived = round(addUp("amount", receipts));
  const amountSent = round(addUp("amount", sendings));
  const amountTotal = round(amountMinted + amountReceived - amountSent);

  const countMints = mints.length;
  const countReceipts = receipts.filter((r) => r.sender !== r.recipient).length;
  const countSendings = receipts.filter((s) => s.sender !== s.recipient).length;

  const uniqueSenders = new Set<PublicKey>();
  receipts.forEach((r) =>
    r.sender !== r.recipient ? uniqueSenders.add(r.sender) : null
  );

  const uniqueRecipients = new Set<PublicKey>();
  sendings.forEach((s) =>
    s.sender !== s.recipient ? uniqueRecipients.add(s.recipient) : null
  );

  return {
    currentBalance: currentBalance + lockedBalance,
    amountMinted,
    amountReceived,
    amountSent,
    amountTotal,
    countMints,
    countReceipts,
    countSendings,
    uniqueRecipients: Array.from(uniqueRecipients),
    uniqueSenders: Array.from(uniqueSenders),
  };
};
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

export const memoisedGetGsolBalance = memoise(
  (address) => address.toBase58(),
  getGsolBalance
);

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

export const earliest = (
  thingsWithTimestamp: Array<{ timestamp: Date }>
): Date => {
  const dates = thingsWithTimestamp.map((m) => m.timestamp);
  return dates.reduce((a, b) => (a < b ? a : b), new Date());
};
