import { PublicKey } from "@solana/web3.js";
import { addUp, round } from "../common/utils";
import mintStub from "./stubs/mints.json";
import sendingStub from "./stubs/sendings.json";
import receiptStub from "./stubs/receipts.json";

const STUB_DB = true;
const STUBS = {
  mints: mintStub,
  sender: sendingStub,
  recipient: receiptStub,
};

const MONGODB_API_URL = process.env.REACT_APP_MONGODB_API_URL ?? "";
const MONGODB_READ_TOKEN = process.env.REACT_APP_MONGODB_READ_TOKEN ?? "";

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

interface Neighbour {
  firstSendingDate: Date;
  amountTotal: number;
}

const makeTransfer = (transfer: TransferResponse): Transfer => ({
  timestamp: new Date(transfer.timestamp),
  sender: new PublicKey(transfer.sender),
  recipient: new PublicKey(transfer.recipient),
  amount: transfer.amount,
});

const makeMint = (mint: MintResponse): Mint => ({
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
    .then((mints) => mints.map(makeMint));
const getAccountReceipts = async (address: PublicKey): Promise<Transfer[]> =>
  getDBData<TransferResponse>("transfers", "recipient", address)
    .then((resp) => resp.documents)
    .then((transfers) => transfers.map(makeTransfer));
const getAccountSendings = async (address: PublicKey): Promise<Transfer[]> =>
  getDBData<TransferResponse>("transfers", "sender", address)
    .then((resp) => resp.documents)
    .then((transfers) => transfers.map(makeTransfer));

const getNeighbors = (sendings: Transfer[]): Record<string, Neighbour> => {
  const neighbors: Record<string, Neighbour> = {};
  sendings.forEach((sending) => {
    if (sending.sender === sending.recipient) return;

    if (neighbors[sending.recipient.toString()] === undefined) {
      neighbors[sending.recipient.toString()] = {
        firstSendingDate: sending.timestamp,
        amountTotal: sending.amount,
      };
      return;
    }

    if (
      sending.timestamp.getTime() <
      neighbors[sending.recipient.toString()].firstSendingDate.getTime()
    ) {
      neighbors[sending.recipient.toString()].firstSendingDate =
        sending.timestamp;
    }

    neighbors[sending.recipient.toString()].amountTotal += sending.amount;
  });

  return neighbors;
};

interface Totals {
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

export interface Forest {
  address: PublicKey;
  mints: Mint[];
  sent: Transfer[];
  received: Transfer[];
  neighbors: Array<Record<string, Neighbour>>;
  totals: Totals;
}
// Get the forest for an address.
// At present, only one level of distance from the source address is supported
export const getForest = async (
  address: PublicKey,
  level: 1
): Promise<Forest> => {
  // TODO iterate over level
  console.log("getting level", level);
  const [mints, received, sent] = await Promise.all([
    getAccountMints(address),
    getAccountReceipts(address),
    getAccountSendings(address),
  ]);
  const neighborsLevel1 = getNeighbors(sent);

  const totals = getTotals(mints, received, sent);

  return {
    address,
    mints,
    sent,
    received,
    neighbors: [neighborsLevel1],
    totals,
  };
};
