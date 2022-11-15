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
    // deposit 100 SOL
    await client.deposit(new BN(100 * LAMPORTS_PER_SOL));

    // burn 50 gSOL
    await burnGSol(new BN(50 * LAMPORTS_PER_SOL), client);

    // trigger a withdrawal
    await client.withdrawToTreasury();

    // expect the treasury to have 50 SOL minus fees
    const fee = 150_000_008; // 0.03 fee - not sure where the 8 lamports comes from - rounding error? TODO
    const expectedTreasuryBalance = new BN(50 * LAMPORTS_PER_SOL).sub(
      new BN(fee)
    );
    await expectTreasurySolBalance(client, expectedTreasuryBalance);
  });
});
