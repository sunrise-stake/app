import { type Connection, PublicKey } from "@solana/web3.js";
import { addUp, memoise, round, settledPromises } from "../common/utils";
import mintStub from "./stubs/mints.json";
import sendingStub from "./stubs/sendings.json";
import receiptStub from "./stubs/receipts.json";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const STUB_DB = false;
const STUBS = {
  mints: mintStub,
  sender: sendingStub,
  recipient: receiptStub,
};

const MONGODB_API_URL = process.env.REACT_APP_MONGODB_API_URL ?? "";
const MONGODB_READ_TOKEN = process.env.REACT_APP_MONGODB_READ_TOKEN ?? "";
export const MAX_FOREST_DEPTH = 2; // the number of levels of tree neighbours to fetch and show

interface MintResponse {
  timestamp: string;
  recipient: string;
  amount: number;
}

interface TransferResponse {
  timestamp: string;
  sender: string;
  recipient: string;
  amount: number;
}

interface MongoResponse<T> {
  documents: T[];
}

interface Mint {
  timestamp: Date;
  recipient: PublicKey;
  amount: number;
}

interface Transfer {
  timestamp: Date;
  sender: PublicKey;
  recipient: PublicKey;
  amount: number;
}

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
    relationship: "PARENT_IS_SENDER" | "PARENT_IS_RECIPIENT";
    relationshipStartDate: Date;
  };
}

// A forest is a tree with neighbours
export interface Forest {
  tree: TreeNode;
  neighbours: Forest[];
}

const buildTransferRecord = (transfer: TransferResponse): Transfer => ({
  timestamp: new Date(transfer.timestamp),
  sender: new PublicKey(transfer.sender),
  recipient: new PublicKey(transfer.recipient),
  amount: transfer.amount,
});

const buildMintRecord = (mint: MintResponse): Mint => ({
  timestamp: new Date(mint.timestamp),
  recipient: new PublicKey(mint.recipient),
  amount: mint.amount,
});

const getDBData = async <T>(
  collection: "mints" | "transfers",
  type: "recipient" | "sender",
  address: PublicKey
): Promise<MongoResponse<T>> => {
  if (STUB_DB) {
    return (
      collection === "mints" ? STUBS.mints : STUBS[type]
    ) as MongoResponse<T>;
  }
  return fetch(`${MONGODB_API_URL}/action/find`, {
    method: "POST",
    headers: {
      "api-key": MONGODB_READ_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataSource: "Cluster0",
      database: "gsol-tracker",
      collection,
      filter: {
        [type]: address.toString(),
      },
    }),
  }).then(async (resp) => resp.json());
};

const getAccountMints = async (address: PublicKey): Promise<Mint[]> =>
  getDBData<MintResponse>("mints", "recipient", address)
    .then((resp) => resp.documents)
    .then((mints) => mints.map(buildMintRecord));
const getAccountReceipts = async (address: PublicKey): Promise<Transfer[]> =>
  getDBData<TransferResponse>("transfers", "recipient", address)
    .then((resp) => resp.documents)
    .then((transfers) => transfers.map(buildTransferRecord));
const getAccountSendings = async (address: PublicKey): Promise<Transfer[]> =>
  getDBData<TransferResponse>("transfers", "sender", address)
    .then((resp) => resp.documents)
    .then((transfers) => transfers.map(buildTransferRecord));

// Given a set of transfers, return the first transfer for each sender-recipient pair
const filterFirstTransfersForSenderAndRecipient = (
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

const getNeighbours = async (
  connection: Connection, // TODO wrap everything in a class so we don't have to pass this around
  sendings: Transfer[],
  receipts: Transfer[],
  depth: number,
  parent: TreeNode
): Promise<Forest[]> => {
  if (depth < 0) return [];

  const sendingNeighboursPromise = Promise.allSettled(
    sendings.map(async (sending) =>
      getForest(connection, sending.recipient, depth, {
        tree: parent,
        relationship: "PARENT_IS_SENDER",
        relationshipStartDate: sending.timestamp,
      })
    )
  );

  const receiptNeighboursPromise = Promise.allSettled(
    receipts.map(async (receipt) =>
      getForest(connection, receipt.sender, depth, {
        tree: parent,
        relationship: "PARENT_IS_RECIPIENT",
        relationshipStartDate: receipt.timestamp,
      })
    )
  );

  // TODO deal with rejected promises
  const sendingNeighbours = settledPromises(await sendingNeighboursPromise);
  const receiptNeighbours = settledPromises(await receiptNeighboursPromise);

  return [...sendingNeighbours, ...receiptNeighbours];
};

interface Totals {
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
const getTotals = (
  currentBalance: number,
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
    currentBalance,
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
const getGsolBalance = async (
  address: PublicKey,
  connection: Connection
): Promise<number> => {
  // TODO remove hard-coded gsol mint and get from the state
  const gsolMint = new PublicKey("gso1xA56hacfgTHTF4F7wN5r4jbnJsKh99vR595uybA");
  const tokenAccount = PublicKey.findProgramAddressSync(
    [address.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), gsolMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
  const balance = await connection.getTokenAccountBalance(tokenAccount);
  return balance.value.uiAmount ?? 0;
};

const memoisedGetGsolBalance = memoise(
  (address) => address.toBase58(),
  getGsolBalance
);

const earliest = (thingsWithTimestamp: Array<{ timestamp: Date }>): Date => {
  const dates = thingsWithTimestamp.map((m) => m.timestamp);
  return dates.reduce((a, b) => (a < b ? a : b), new Date());
};

// Get the forest for an address.
// At present, only one level of distance from the source address is supported
export const getForest = async (
  connection: Connection,
  address: PublicKey,
  depth: number = MAX_FOREST_DEPTH,
  parent?: TreeNode["parent"]
): Promise<Forest> => {
  if (depth < 0) throw new Error("Depth must be greater than or equal to 0");
  if (depth > MAX_FOREST_DEPTH)
    throw new Error(`Depth must be less than ${MAX_FOREST_DEPTH}`);

  console.log("getting depth", depth);
  const [currentBalance, mints, received, sent] = await Promise.all([
    memoisedGetGsolBalance(address, connection),
    getAccountMints(address),
    getAccountReceipts(address),
    getAccountSendings(address),
  ]);
  const totals = getTotals(currentBalance, mints, received, sent);
  const startDate = earliest([...mints, ...received, ...sent]);

  const treeNode: TreeNode = {
    address,
    mints,
    sent,
    received,
    totals,
    startDate,
    parent,
  };

  // recursion happens here:
  const neighbours = await getNeighbours(
    connection,
    filterFirstTransfersForSenderAndRecipient(sent),
    filterFirstTransfersForSenderAndRecipient(received),
    depth - 1,
    treeNode
  );

  return {
    tree: treeNode,
    neighbours,
  };
};
