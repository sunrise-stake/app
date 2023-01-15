import BN from "bn.js";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { SunriseStakeClient } from "../app/src/lib/client";
import {
  burnGSol,
  calculateFee,
  expectAmount,
  expectLiqPoolTokenBalance,
  expectMSolTokenBalance,
  expectStakerGSolTokenBalance,
  expectStakerSolBalance,
  expectTreasurySolBalance,
  getBalance,
  getLPPrice,
  log,
  NETWORK_FEE,
} from "./util";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { TicketAccount } from "@sunrisestake/app/src/lib/client/types/TicketAccount";
import {
  DEFAULT_LP_MIN_PROPORTION,
  DEFAULT_LP_PROPORTION,
} from "@sunrisestake/app/src/lib/constants";

chai.use(chaiAsPromised);

const { expect } = chai;
describe("sunrise-stake", () => {
  let client: SunriseStakeClient;

  const depositLamports = new BN(100 * LAMPORTS_PER_SOL); // Deposit 100 SOL
  const unstakeLamportsUnderLPBalance = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL
  const unstakeLamportsExceedLPBalance = new BN(20 * LAMPORTS_PER_SOL); // 20 SOL
  const orderUnstakeLamports = new BN(2 * LAMPORTS_PER_SOL); // Order a delayed unstake of 2 SOL
  const burnLamports = 100 * LAMPORTS_PER_SOL;

  let treasury = Keypair.generate();
  let updateAuthority: Keypair;

  let delayedUnstakeTicket: TicketAccount;

  it("can register a new Sunrise state", async () => {
    client = await SunriseStakeClient.register(
      treasury.publicKey,
      Keypair.generate(),
      {
        verbose: Boolean(process.env.VERBOSE),
      }
    );

    log(await client.details());
  });

  it("can update the state", async () => {
    treasury = Keypair.generate();
    updateAuthority = Keypair.generate();

    await client.update({
      newTreasury: treasury.publicKey,
      newUpdateAuthority: updateAuthority.publicKey,
    });

    expect(client.config?.treasury.toBase58()).to.equal(
      treasury.publicKey.toBase58()
    );
    expect(client.config?.updateAuthority.toBase58()).to.equal(
      updateAuthority.publicKey.toBase58()
    );
    // unchanged properties
    expect(client.config?.liqPoolProportion).to.equal(DEFAULT_LP_PROPORTION);
    expect(client.config?.liqPoolMinProportion).to.equal(
      DEFAULT_LP_MIN_PROPORTION
    );
  });

  it("can resize the state", async () => {
    await client.program.methods
      .resizeState(
        new BN(
          32 +
            32 +
            32 +
            32 +
            1 +
            1 +
            1 +
            1 +
            8 + // Base size
            10 // extra space
        )
      )
      .accounts({
        state: client.stateAddress,
        payer: client.provider.publicKey,
        updateAuthority: updateAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([updateAuthority])
      .rpc();
  });

  it("returns zero extractable yield if no SOL has been staked", async () => {
    const earnedYield = await client.extractableYield();
    expect(earnedYield.toNumber()).to.equal(0);
  });

  it("can trigger a rebalance that does nothing", async () => {
    const previousMsolBalance = await client
      .balance()
      .then((b) => b.msolBalance);
    await client.triggerRebalance();
    const msolBalanceAfterRebalance = await client
      .balance()
      .then((b) => b.msolBalance);
    expect(Number(msolBalanceAfterRebalance.amount)).to.equal(
      Number(previousMsolBalance.amount)
    );
  });

  it("can deposit sol", async () => {
    await getBalance(client); // print balance before deposit

    // figure out what balances we expect before we make the deposit
    // since this is the first deposit, 10% will go into the liquidity pool
    // so the sunrise liquidity pool token balance should go up,
    // and the sunrise msol balance should be at 90% of the value of the deposit
    const lpPrice = await getLPPrice(client); // TODO should this be inverse price?
    const expectedMsol = Math.floor(
      (depositLamports.toNumber() * 0.9) / client.marinadeState!.mSolPrice
    );
    const expectedLiqPool = Math.floor(
      (depositLamports.toNumber() * 0.1) / lpPrice
    );

    await client.deposit(depositLamports);

    await expectMSolTokenBalance(client, expectedMsol, 50);
    await expectLiqPoolTokenBalance(client, expectedLiqPool, 50);
    await expectStakerGSolTokenBalance(client, depositLamports.toNumber());
  });

  it("no yield to extract yet", async () => {
    const yieldToExtract = await client.extractableYield();
    log("yield to withdraw", yieldToExtract.toString());

    expectAmount(yieldToExtract, 0, 100);
  });

  it("can feelessly unstake sol when under the level of the LP", async () => {
    const stakerPreSolBalance = await getBalance(client);

    await client.unstake(unstakeLamportsUnderLPBalance);

    const expectedPostUnstakeBalance = stakerPreSolBalance
      .add(unstakeLamportsUnderLPBalance)
      .subn(NETWORK_FEE);

    // use a tolerance here as the exact value depends on network fees
    // which, for the first few slots on the test validator, are
    // variable
    await expectStakerSolBalance(client, expectedPostUnstakeBalance, 100);
  });

  it("can unstake sol with a liquid unstake fee when doing so exceeds the amount in the LP", async () => {
    const liquidUnstakeFee = await calculateFee(
      client,
      unstakeLamportsExceedLPBalance
    );

    const stakerPreSolBalance = await getBalance(client);

    const gsolBalance = await client.provider.connection.getTokenAccountBalance(
      client.stakerGSolTokenAccount!
    );

    log("Before big unstake");
    await client.extractableYield();

    await client.unstake(unstakeLamportsExceedLPBalance);

    log("after big unstake");
    await client.extractableYield();

    await expectStakerGSolTokenBalance(
      client,
      new BN(gsolBalance.value.amount).sub(unstakeLamportsExceedLPBalance)
    );

    const expectedPostUnstakeBalance = stakerPreSolBalance
      .add(unstakeLamportsExceedLPBalance)
      .sub(liquidUnstakeFee);

    // use a tolerance here as the exact value depends on network fees
    // which, for the first few slots on the test validator, are
    // variable, as well as floating point precision
    await expectStakerSolBalance(client, expectedPostUnstakeBalance, 100);
  });

  it("registers negative extractable yield while a rebalance is in-flight", async () => {
    // since we do not count the in-flight SOL that is being used to rebalance the LP
    // we expect the extractable yield to be negative after a large liquid unstake that
    // triggers a rebalance
    const extractableYield = await client.extractableYield();
    expect(extractableYield.toNumber()).to.be.lessThan(0);
  });

  it("can order a delayed unstake", async () => {
    const [txSig] = await client.orderUnstake(orderUnstakeLamports);
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
      orderUnstakeLamports.subn(1).toString()
    );
  });

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
    log("Waiting 20s for next epoch...");
    await new Promise((resolve) => setTimeout(resolve, 20000));

    await client.provider.connection.getEpochInfo().then(log);

    const sunriseLamports = await client.provider.connection
      .getAccountInfo(delayedUnstakeTicket.address)
      .then((account) => account?.lamports);
    const marinadeLamports = await client.provider.connection
      .getAccountInfo(delayedUnstakeTicket.marinadeTicketAccount)
      .then((account) => account?.lamports);

    log(
      "total reclaimed rent: ",
      sunriseLamports,
      marinadeLamports,
      (sunriseLamports ?? 0) + (marinadeLamports ?? 0)
    );
    log("ticket size: ", orderUnstakeLamports.toString());
    log("existing balance", stakerPreSolBalance.toString());
    log(
      "existing balance plus reclaimed rent",
      stakerPreSolBalance
        .addn(sunriseLamports ?? 0)
        .addn(marinadeLamports ?? 0)
        .toString()
    );

    await client.claimUnstakeTicket(delayedUnstakeTicket);

    // the staker does not get the marinade ticket rent
    const expectedPostUnstakeBalance = stakerPreSolBalance
      .add(orderUnstakeLamports)
      .addn(sunriseLamports ?? 0)
      .subn(5000);
    await expectStakerSolBalance(client, expectedPostUnstakeBalance, 100);
  });

  it("can recover previous epoch rebalance tickets by triggering a new rebalance", async () => {
    const yieldToExtractBefore = await client.extractableYield();
    log("yield to extract before", yieldToExtractBefore.toString());

    await client.triggerRebalance();

    const yieldToExtractAfter = await client.extractableYield();
    log("yield to extract after", yieldToExtractAfter.toString());
  });

  it("can detect yield to extract", async () => {
    // deposit 1000 SOL, then burn 100 gSOL so there is some earned yield
    // Note - we have to do this as we do not have the ability to increase the msol value
    const depositedLamports = 1000 * LAMPORTS_PER_SOL;

    await client.deposit(new BN(depositedLamports));

    log(
      "gsol supply:",
      await client.provider.connection.getTokenSupply(client.config!.gsolMint)
    );

    const preBurnYieldToExtract = await client.extractableYield();
    log("pre-burn yield to extract", preBurnYieldToExtract.toString());

    // burn 100 gSOL so that there is some unclaimed yield for the crank operation to harvest
    await burnGSol(new BN(burnLamports), client);

    const yieldToExtract = await client.extractableYield();
    log("yield to extract", yieldToExtract.toString());

    // subtract 0.3% liquid unstake fee until we do delayed unstake
    const expectedYield = new BN(burnLamports).muln(997).divn(1000);

    expectAmount(yieldToExtract, expectedYield, 50);
  });

  it("can extract earned yield", async () => {
    await expectTreasurySolBalance(client, 0, 10);

    // trigger a withdrawal
    await client.extractYield();

    // expect the treasury to have 500 SOL minus fees
    // marinade charges a 0.3% fee for liquid unstaking
    const expectedTreasuryBalance = new BN(burnLamports).muln(997).divn(1000);
    await expectTreasurySolBalance(client, expectedTreasuryBalance, 10);
  });
});
