import BN from "bn.js";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SunriseStakeClient } from "../app/src/lib/client";
import {
  burnGSol,
  expectMSolTokenBalance,
  expectStakerGSolTokenBalance,
  expectStakerSolBalance,
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

  const depositSOL = new BN(10_000_000_000); // Deposit 10 SOL
  const unstakeSOL = new BN(2_000_000_000); // Unstake 2 SOL
  const orderUnstakeSOL = new BN(2_000_000_000); // Order a delayed unstake of 2 SOL

  let treasury = Keypair.generate();
  let updateAuthority;

  let delayedUnstakeTicket: TicketAccount;

  it("can register a new Sunrise state", async () => {
    client = await SunriseStakeClient.register(
      treasury.publicKey,
      Keypair.generate()
    );
  });

  it("can update the state treasury and update authority", async () => {
    treasury = Keypair.generate();
    updateAuthority = Keypair.generate();

    client = await SunriseStakeClient.update(
      client.stateAddress,
      treasury.publicKey,
      updateAuthority.publicKey
    );

    expect(client.config?.treasury.toBase58()).to.equal(
      treasury.publicKey.toBase58()
    );
    expect(client.config?.updateAuthority.toBase58()).to.equal(
      updateAuthority.publicKey.toBase58()
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
    const expectedMsol = Math.floor(
      depositSOL.toNumber() / client.marinadeState!.mSolPrice
    );
    await expectMSolTokenBalance(client, expectedMsol, 10);
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

    // 0.03% fee for immediate withdrawal
    // Add 5k lamports for network fees
    // TODO Double check this with different values for unstakeSOL
    const fee = unstakeSOL.muln(3).divn(1000).addn(5000);
    const expectedPostUnstakeBalance = stakerPreSolBalance
      .add(unstakeSOL)
      .sub(fee);
    // use min here as the exact value depends on network fees
    // which, for the first few slots on the test validator, are
    // variable
    await expectStakerSolBalance(client, expectedPostUnstakeBalance, 50);
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
    const shouldFail = client.claimUnstakeTicket(delayedUnstakeTicket);

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

    const sunriseLamports = await client.provider.connection
      .getAccountInfo(delayedUnstakeTicket.address)
      .then((account) => account?.lamports);
    const marinadeLamports = await client.provider.connection
      .getAccountInfo(delayedUnstakeTicket.marinadeTicketAccount)
      .then((account) => account?.lamports);

    console.log(
      "total reclaimed rent: ",
      sunriseLamports,
      marinadeLamports,
      (sunriseLamports ?? 0) + (marinadeLamports ?? 0)
    );
    console.log("ticket size: ", orderUnstakeSOL.toString());
    console.log("existing balance", stakerPreSolBalance.toString());
    console.log(
      "existing balance plus reclaimed rent",
      stakerPreSolBalance
        .addn(sunriseLamports ?? 0)
        .addn(marinadeLamports ?? 0)
        .toString()
    );

    await client.claimUnstakeTicket(delayedUnstakeTicket);

    // the staker does not get the marinade ticket rent
    const expectedPostUnstakeBalance = stakerPreSolBalance
      .add(orderUnstakeSOL)
      .addn(sunriseLamports ?? 0)
      .subn(5000);
    await expectStakerSolBalance(client, expectedPostUnstakeBalance, 50);
  });

  it("can withdraw to the treasury", async () => {
    // deposit 1000 SOL
    const depositedLamports = 1000 * LAMPORTS_PER_SOL;
    const burnedLamports = 500 * LAMPORTS_PER_SOL;
    const remainingLamports = depositedLamports - burnedLamports;

    await client.deposit(new BN(depositedLamports));

    // burn 500 gSOL so that there is some unclaimed yield for the crank operation to harvest
    await burnGSol(new BN(burnedLamports), client);

    // trigger a withdrawal
    await client.withdrawToTreasury();

    // expect the treasury to have 500 SOL minus fees
    // marinade charges a 0.3% fee for liquid unstaking
    const fee = remainingLamports * 0.003;
    const expectedTreasuryBalance = new BN(remainingLamports).sub(new BN(fee));
    await expectTreasurySolBalance(client, expectedTreasuryBalance, 10);
  });
});
