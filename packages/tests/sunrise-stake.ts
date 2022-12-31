import BN from "bn.js";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SunriseStakeClient } from "../app/src/lib/client";
import {
  burnGSol,
  expectMSolTokenBalance,
  expectStakerGSolTokenBalance,
  expectStakerSolBalanceMin,
  expectTreasurySolBalance,
  getBalance,
} from "./util";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { TicketAccount } from "@sunrisestake/app/src/lib/client/types/TicketAccount";

chai.use(chaiAsPromised);

const { expect } = chai;

describe("sunrise-stake", () => {
  let client: SunriseStakeClient;

  const depositSOL = new BN(1_000_000);
  const unstakeSOL = new BN(200_000);
  const orderUnstakeSOL = new BN(200_000);

  const treasury = Keypair.generate();

  let delayedUnstakeTicket: TicketAccount;

  it("can register a new Sunrise state", async () => {
    client = await SunriseStakeClient.register(
      treasury.publicKey,
      Keypair.generate()
    );
  });

  it("can deposit sol", async () => {
    await getBalance(client); // print balance before deposit

    // log stuff
    await client.details().then(console.log);

    const txSig = await client.deposit(depositSOL);
    // TODO Either remove this line or abstract it out into a function. object destructuring an inline awaited function call is not nice.
    await client.provider.connection.confirmTransaction({
      signature: txSig,
      ...(await client.provider.connection.getLatestBlockhash()),
    });
    const tx = await client.provider.connection.getParsedTransaction(
      txSig,
      "confirmed"
    );

    console.log("fee", tx?.meta?.fee);
    console.log("prebalances", tx?.meta?.preBalances);
    console.log("postbalances", tx?.meta?.postBalances);

    console.log(
      "client.marinadeState!.mSolPrice",
      client.marinadeState!.mSolPrice
    );

    const expectedMsol = Math.floor(
      depositSOL.toNumber() / client.marinadeState!.mSolPrice
    );
    await expectMSolTokenBalance(client, expectedMsol);

    await expectStakerGSolTokenBalance(client, depositSOL.toNumber());

    const stakerSolBalance = await client.provider.connection.getBalance(
      client.staker
    );
    console.log("Staker SOL balance", stakerSolBalance);
  });

  it("can unstake sol", async () => {
    const stakerPreSolBalance = await getBalance(client);

    // log stuff
    await client.details().then(console.log);

    const gsolBalance = await client.provider.connection.getTokenAccountBalance(
      client.stakerGSolTokenAccount!
    );
    const txSig = await client.unstake(unstakeSOL);

    await expectStakerGSolTokenBalance(
      client,
      new BN(gsolBalance.value.amount).sub(unstakeSOL)
    );

    // wait for the tx to confirm
    // TODO Either remove this line or abstract it out into a function. object destructuring an inline awaited function call is not nice.
    await client.provider.connection.confirmTransaction({
      signature: txSig,
      ...(await client.provider.connection.getLatestBlockhash()),
    });
    const tx = await client.provider.connection.getParsedTransaction(
      txSig,
      "confirmed"
    );
    console.log("fees for tx:", tx?.meta?.fee);

    // 0.3% fee for immediate withdrawal
    // Add 5k lamports for network fees
    // TODO Double check this with different values for unstakeSOL
    const fee = unstakeSOL.muln(0.003).addn(5000);
    // use string equality to allow large numbers.
    // throws assertion errors if the number is large
    const expectedPostUnstakeBalance = stakerPreSolBalance
      .add(unstakeSOL)
      .sub(fee);
    // use min here as the exact value depends on network fees
    // which, for the first few slots on the test validator, are
    // variable
    await expectStakerSolBalanceMin(client, expectedPostUnstakeBalance);
  });

  it("can order a delayed unstake", async () => {
    const [txSig] = await client.orderUnstake(orderUnstakeSOL);
    const blockhash = await client.provider.connection.getLatestBlockhash();
    await client.provider.connection.confirmTransaction({
      signature: txSig,
      ...blockhash,
    });

    const delayedUnstakeTickets = await client.getDelayedUnstakeTickets();

    expect(delayedUnstakeTickets.length).to.equal(1);

    delayedUnstakeTicket = delayedUnstakeTickets[0];

    // -1 due to rounding error in the program. TODO fix this
    expect(delayedUnstakeTicket.lamportsAmount.toString()).to.equal(
      orderUnstakeSOL.subn(1).toString()
    );
  });

  // Note - dependent on the previous test
  it("cannot claim an unstake ticket until one epoch has passed", async () => {
    const shouldFail = client.claimUnstakeTicket(delayedUnstakeTicket.address);

    // TODO expose the error message from the program
    return expect(shouldFail).to.be.rejectedWith(
      "custom program error: 0x1103"
    );
  });

  it("can claim an unstake ticket after one epoch has passed", async () => {
    const stakerPreSolBalance = await getBalance(client);

    // unfortunately with the test validator, it is impossible to move the epoch forward without just waiting.
    // we run the validator at 32 slots per epoch, so we "only" need to wait for ~16 seconds
    // wait 20 seconds to be safe
    // An alternative is to write rust tests using solana-program-test
    console.log("Waiting 20s for next epoch...");
    await new Promise((resolve) => setTimeout(resolve, 20000));
    await client.provider.connection.getEpochInfo().then(console.log);

    await client.claimUnstakeTicket(delayedUnstakeTicket.address);

    const expectedPostUnstakeBalance = stakerPreSolBalance.add(orderUnstakeSOL);
    await expectStakerSolBalanceMin(client, expectedPostUnstakeBalance);
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
