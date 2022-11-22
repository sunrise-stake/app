import { SunriseStakeClient } from "@sunrisestake/app/src/lib/client";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { expect } from "chai";

export const burnGSol = async (amount: BN, client: SunriseStakeClient) => {
  const burnInstruction = Token.createBurnInstruction(
    TOKEN_PROGRAM_ID,
    client.config!.gsolMint,
    client.stakerGSolTokenAccount!,
    client.provider.publicKey,
    [],
    amount.toNumber()
  );
  const transaction = new Transaction().add(burnInstruction);
  return client.provider.sendAndConfirm(transaction, []);
};

export const expectStakerGSolTokenBalance = async (
  client: SunriseStakeClient,
  amount: number | BN
) => {
  const gsolBalance = await client.provider.connection.getTokenAccountBalance(
    client.stakerGSolTokenAccount!
  );
  console.log("Staker's gSOL balance", gsolBalance.value.uiAmount);
  expect(gsolBalance.value.amount).to.equal(new BN(amount).toString());
};

export const expectMSolTokenBalance = async (
  client: SunriseStakeClient,
  amount: number | BN
) => {
  const msolBalance = await client.provider.connection.getTokenAccountBalance(
    client.msolTokenAccount!
  );
  console.log("mSOL balance", msolBalance.value.uiAmount);
  expect(msolBalance.value.amount).to.equal(new BN(amount).toString());
};

// these functions using string equality to allow large numbers.
// BN(number) throws assertion errors if the number is large
export const expectStakerSolBalance = async (
  client: SunriseStakeClient,
  amount: number | BN
) => {
  const treasuryBalance = await client.provider.connection.getBalance(
    client.staker
  );
  console.log("Staker SOL balance", treasuryBalance);
  expect(`${treasuryBalance}`).to.equal(new BN(amount).toString());
};

export const expectTreasurySolBalance = async (
  client: SunriseStakeClient,
  amount: number | BN
) => {
  const treasuryBalance = await client.provider.connection.getBalance(
    client.config!.treasury
  );
  console.log("Treasury SOL balance", treasuryBalance);
  expect(`${treasuryBalance}`).to.equal(new BN(amount).toString());
};
