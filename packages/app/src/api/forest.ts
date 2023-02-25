import { PublicKey } from "@solana/web3.js";
import { addUp, round } from "../common/utils";

const MONGODB_API_URL = process.env.MONGODB_API_URL ?? "";
const MONGODB_READ_TOKEN = process.env.MONGODB_READ_TOKEN ?? "";

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
  collection: string,
  type: "recipient" | "sender",
  address: PublicKey
): Promise<MongoResponse<T>> =>
  fetch(`${MONGODB_API_URL}/action/find`, {
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

const getAccountMints = async (address: PublicKey): Promise<Mint[]> =>
  getDBData<MintResponse>("mints", "recipient", address)
    .then((resp) => resp.documents)
    .then((mints) => mints.map(makeMint));
const getAccountReceivals = async (address: PublicKey): Promise<Transfer[]> =>
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
  countReceivals: number;
  countSendings: number;
  uniqueSenders: PublicKey[];
  uniqueRecipients: PublicKey[];
}
const getTotals = (
  mints: Mint[],
  receivals: Transfer[],
  sendings: Transfer[]
): Totals => {
  const amountMinted = round(addUp("amount", mints));
  const amountReceived = round(addUp("amount", receivals));
  const amountSent = round(addUp("amount", sendings));
  const amountTotal = round(amountMinted + amountReceived - amountSent);

  const countMints = mints.length;
  const countReceivals = receivals.filter(
    (r) => r.sender !== r.recipient
  ).length;
  const countSendings = receivals.filter(
    (s) => s.sender !== s.recipient
  ).length;

  const uniqueSenders = new Set<PublicKey>();
  receivals.forEach((r) =>
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
    countReceivals,
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
  neighbors: Record<string, Neighbour>;
  totals: Totals;
}
// Get the forest for an address.
// At present, only one level of distance from the source address is supported
export const getForest = async (
  address: PublicKey,
  level: 1
): Promise<Forest> => {
  const [mints, received, sent] = await Promise.all([
    getAccountMints(address),
    getAccountReceivals(address),
    getAccountSendings(address),
  ]);
  const neighbors = getNeighbors(sent);

  // TODO iterate over level
  console.log("getting level", level);

  const totals = getTotals(mints, received, sent);

  return {
    address,
    mints,
    sent,
    received,
    neighbors,
    totals,
  };
};
