import {
  type GetNeighboursResponse,
  type NeighbourEntry,
  type RawGetNeighboursResponse,
  type RawNeighbourEntry,
} from "./types";
import { PublicKey } from "@solana/web3.js";

const GET_NEIGHBOURS_URL = import.meta.env.REACT_APP_GET_NEIGHBOURS_URL ?? "";

const fromRawNeighbourEntry = (
  rawEntry: RawNeighbourEntry
): NeighbourEntry => ({
  ...rawEntry,
  address: new PublicKey(rawEntry.address),
  start: new Date(rawEntry.start),
  end: new Date(rawEntry.end),
  sender: new PublicKey(rawEntry.sender),
  recipient: new PublicKey(rawEntry.recipient),
});

export const getNeighbours = async (
  address: PublicKey,
  depth: number
): Promise<GetNeighboursResponse> =>
  fetch(`${GET_NEIGHBOURS_URL}/${address.toBase58()}?depth=${depth}`)
    .then(async (resp) => resp.json() as Promise<RawGetNeighboursResponse>)
    .then((rawResponse) => ({
      firstTransfer: rawResponse.firstTransfer
        ? new Date(rawResponse.firstTransfer)
        : null,
      lastTransfer: rawResponse.lastTransfer
        ? new Date(rawResponse.lastTransfer)
        : null,
      neighbours: {
        senderResult: rawResponse.neighbours.senderResult.map(
          fromRawNeighbourEntry
        ),
        recipientResult: rawResponse.neighbours.recipientResult.map(
          fromRawNeighbourEntry
        ),
      },
    }));
