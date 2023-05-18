import {
  type Mint,
  type MintResponse,
  type MongoResponse,
  type Transfer,
  type TransferResponse,
} from "./types";
import { PublicKey } from "@solana/web3.js";
import mintStub from "./stubs/mints.json";
import sendingStub from "./stubs/sendings.json";
import receiptStub from "./stubs/receipts.json";

const STUB_DB = false;
const STUBS = {
  mints: mintStub,
  sender: sendingStub,
  recipient: receiptStub,
};
const MONGODB_API_URL = process.env.REACT_APP_MONGODB_API_URL ?? "";
const MONGODB_READ_TOKEN = process.env.REACT_APP_MONGODB_READ_TOKEN ?? "";
const buildTransferRecord = (transfer: TransferResponse): Transfer => ({
  timestamp: new Date(transfer.timestamp),
  sender: new PublicKey(transfer.sender),
  recipient: new PublicKey(transfer.recipient),
  amount: transfer.amount,
});
const buildMintRecord = (mint: MintResponse): Mint => ({
  timestamp: new Date(mint.timestamp),
  recipient: new PublicKey(mint.recipient),
  sender: mint.sender !== undefined ? new PublicKey(mint.sender) : undefined,
  amount: mint.amount,
});
const getDBData = async <T>(
  collection: "mints" | "transfers",
  types: Array<"recipient" | "sender">,
  address: PublicKey
): Promise<MongoResponse<T>> => {
  if (STUB_DB) {
    return (
      collection === "mints"
        ? STUBS.mints
        : types.flatMap((type) => STUBS[type])
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
        $or: types.map((type) => ({
          [type]: address.toString(),
        })),
      },
    }),
  }).then(async (resp) => resp.json());
};
export const getAccountMints = async (address: PublicKey): Promise<Mint[]> =>
  getDBData<MintResponse>("mints", ["sender", "recipient"], address)
    .then((resp) => resp.documents)
    .then((mints) => mints.map(buildMintRecord));
export const getAccountTransfers = async (
  address: PublicKey
): Promise<Transfer[]> =>
  getDBData<TransferResponse>("transfers", ["sender", "recipient"], address)
    .then((resp) => resp.documents)
    .then((transfers) => transfers.map(buildTransferRecord));
