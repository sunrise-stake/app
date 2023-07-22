import {
  type GetNeighboursResponse,
  type Mint,
  type MintResponse,
  type MongoResponse,
  type RawGetNeighboursResponse,
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
const GET_NEIGHBOURS_URL = process.env.REACT_APP_GET_NEIGHBOURS_URL ?? "";
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

export const getNeighbours = async (
  address: PublicKey,
  depth: number
): Promise<GetNeighboursResponse> =>
  fetch(`${GET_NEIGHBOURS_URL}/${address.toBase58()}?depth=${depth}`)
    .then(async (resp) => resp.json() as Promise<RawGetNeighboursResponse>)
    .then((rawResponse) => ({
      firstTransfer: new Date(rawResponse.firstTransfer),
      lastTransfer: new Date(rawResponse.lastTransfer),
      neighbours: {
        senderResult: rawResponse.neighbours.senderResult.map((result) => ({
          ...result,
          address: new PublicKey(result.address),
          start: new Date(result.start),
          end: new Date(result.end),
          senders: result.senders.map((sender) => new PublicKey(sender)),
        })),
        recipientResult: rawResponse.neighbours.recipientResult.map(
          (result) => ({
            ...result,
            address: new PublicKey(result.address),
            start: new Date(result.start),
            end: new Date(result.end),
            recipients: result.recipients.map(
              (recipient) => new PublicKey(recipient)
            ),
          })
        ),
      },
    }));

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
