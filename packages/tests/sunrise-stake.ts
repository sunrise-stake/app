import BN from "bn.js";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SunriseStakeClient } from "../app/src/lib/client";
import {
  burnGSol,
  expectMSolTokenBalance,
  expectStakerGSolTokenBalance,
  expectStakerSolBalance,
  expectTreasurySolBalance,
} from "./util";

describe("sunrise-stake", () => {
  let client: SunriseStakeClient;

  const depositSOL = new BN(1_000_000);

  const treasury = Keypair.generate();

  it("can register a new Sunrise state", async () => {
    client = await SunriseStakeClient.register(treasury.publicKey);
  });

  it("can deposit sol", async () => {
    // log stuff
    await client.details().then(console.log);

    await client.deposit(depositSOL);

    const expectedMsol = Math.floor(
      depositSOL.toNumber() / client.marinadeState!.mSolPrice
    );
    await expectMSolTokenBalance(client, expectedMsol);

    await expectStakerGSolTokenBalance(client, depositSOL.toNumber());
  });

  it("can unstake sol", async () => {
    const stakerPreSolBalance = await client.provider.connection.getBalance(
      client.staker
    );
    console.log(
      "Staker's sol balance before withdrawing: ",
      stakerPreSolBalance
    );

    const gsolBalance = await client.provider.connection.getTokenAccountBalance(
      client.stakerGSolTokenAccount!
    );
    await client.unstake(new BN(gsolBalance.value.amount));

    await expectStakerGSolTokenBalance(client, 0);

    // 0.3% fee for immediate withdrawal
    // Add 5k lamports for network fees
    // TODO Double check this with different values for depositSOL
    const fee = depositSOL.muln(0.003).addn(5000);
    // use string equality to allow large numbers.
    // throws assertion errors if the number is large
    const expectedPostUnstakeBalance = new BN(`${stakerPreSolBalance}`)
      .add(depositSOL)
      .sub(fee);
    await expectStakerSolBalance(client, expectedPostUnstakeBalance);
  });

  it("can withdraw to the treasury", async () => {
    // deposit 1000 SOL
    const depositedLamports = 1000 * LAMPORTS_PER_SOL;
    const burnedLamports = 500 * LAMPORTS_PER_SOL;
    const remainingLamports = depositedLamports - burnedLamports;

    await client.deposit(new BN(depositedLamports));

    // burn 500 gSOL
    await burnGSol(new BN(burnedLamports), client);

    // trigger a withdrawal
    await client.withdrawToTreasury();

    // expect the treasury to have 500 SOL minus fees
    // marinade charges a 0.3% fee for liquid unstaking
    const fee = remainingLamports * 0.003;
    const expectedTreasuryBalance = new BN(remainingLamports).sub(new BN(fee));
    await expectTreasurySolBalance(client, expectedTreasuryBalance);
  });
});
