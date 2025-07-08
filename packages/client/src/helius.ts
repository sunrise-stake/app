import { type Transaction } from "@solana/web3.js";

export const getPriorityFee = async (
  heliusURL: string,
  transaction: Transaction
): Promise<number> => {
  const requestBody = JSON.stringify({
    jsonrpc: "2.0",
    id: "1",
    method: "getPriorityFeeEstimate",
    params: [
      {
        accountKeys: transaction.instructions.flatMap((instruction) =>
          instruction.keys.map((key) => key.pubkey.toBase58())
        ),
        options: {
          recommended: true,
        },
      },
    ],
  });

  console.log("Requesting priority fee estimate from Helius", requestBody);

  const response = await fetch(heliusURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
  });
  const responseBody = await response.json();
  console.log(responseBody);
  const { result }: { result: { priorityFeeEstimate: number } } = responseBody;

  return result.priorityFeeEstimate;
};
