import { SunriseStakeClient } from "@sunrisestake/app/src/lib/client";
import { Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { expect } from "chai";
import { createBurnInstruction } from "@solana/spl-token";

export const burnGSol = async (amount: BN, client: SunriseStakeClient) => {
  const burnInstruction = createBurnInstruction(
    client.stakerGSolTokenAccount!,
    client.config!.gsolMint,
    client.staker,
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

const expectAmount = (
  actualAmount: number | BN,
  expectedAmount: number | BN,
  tolerance = 0
) => {
  const actualAmountBN = new BN(actualAmount);
  const minExpected = new BN(expectedAmount).subn(tolerance);
  const maxExpected = new BN(expectedAmount).addn(tolerance);

  console.log(
    "Expecting ",
    actualAmountBN.toString(),
    "to be at least",
    new BN(minExpected).toString(),
    "and at most",
    new BN(maxExpected).toString()
  );

  expect(actualAmountBN.gte(minExpected)).to.be.true;
  expect(actualAmountBN.lte(maxExpected)).to.be.true;
};

export const expectMSolTokenBalance = async (
  client: SunriseStakeClient,
  expectedAmount: number | BN,
  tolerance = 0 // Allow for a tolerance as the msol calculation is inaccurate. The test uses the price which has limited precision
) => {
  const msolBalance = await client.provider.connection.getTokenAccountBalance(
    client.msolTokenAccount!
  );
  console.log("mSOL balance", msolBalance.value.uiAmount);
  expectAmount(new BN(msolBalance.value.amount), expectedAmount, tolerance);
};

export const getBalance = async (client: SunriseStakeClient) => {
  const balance = await client.provider.connection.getBalance(client.staker);
  console.log("Staker SOL balance", balance);
  // cast to string then convert to BN as BN has trouble with large values of type number in its constructor
  return new BN(`${balance}`);
};

// these functions using string equality to allow large numbers.
// BN(number) throws assertion errors if the number is large
export const expectStakerSolBalance = async (
  client: SunriseStakeClient,
  expectedAmount: number | BN,
  tolerance = 0 // Allow for a tolerance as the balance depends on the fees which are unstable at the beginning of a test validator
) => {
  const actualAmount = await getBalance(client);
  expectAmount(actualAmount, expectedAmount, tolerance);
};

export const expectTreasurySolBalance = async (
  client: SunriseStakeClient,
  expectedAmount: number | BN,
  tolerance = 0 // Allow for a tolerance as the balance depends on the fees which are unstable at the beginning of a test validator
) => {
  const treasuryBalance = await client.provider.connection.getBalance(
    client.config!.treasury
  );
  console.log("Treasury SOL balance", treasuryBalance);
  expectAmount(treasuryBalance, expectedAmount, tolerance);
};
