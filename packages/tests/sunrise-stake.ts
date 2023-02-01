import BN from "bn.js";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import {
  SunriseStakeClient,
  TicketAccount,
  getStakePoolAccount,
  DEFAULT_LP_MIN_PROPORTION,
  DEFAULT_LP_PROPORTION,
  NETWORK_FEE,
} from "@sunrisestake/client";
import {
  burnGSol,
  expectAmount,
  expectLiqPoolTokenBalance,
  expectMSolTokenBalance,
  expectStakerGSolTokenBalance,
  expectStakerSolBalance,
  expectTreasurySolBalance,
  getBalance,
  getLPPrice,
  getBsolPrice,
  log,
  waitForNextEpoch,
  expectBSolTokenBalance,
  initializeStakeAccount,
} from "./util";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { MarinadeConfig, Marinade } from "@marinade.finance/marinade-ts-sdk";

chai.use(chaiAsPromised);

const { expect } = chai;
describe("sunrise-stake", () => {
  let client: SunriseStakeClient;

  const depositLamports = new BN(100 * LAMPORTS_PER_SOL); // Deposit 100 SOL
  const unstakeLamportsUnderLPBalance = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL
  const unstakeLamportsExceedLPBalance = new BN(20 * LAMPORTS_PER_SOL); // 20 SOL
  const orderUnstakeLamports = new BN(2 * LAMPORTS_PER_SOL); // Order a delayed unstake of 2 SOL
  const burnLamports = 100 * LAMPORTS_PER_SOL;

  let updateAuthority: Keypair;
  let delayedUnstakeTicket: TicketAccount;

  let treasury = Keypair.generate();
  const mint = Keypair.generate();

  it("can register a new Sunrise state", async () => {
    client = await SunriseStakeClient.register(treasury.publicKey, mint, {
      verbose: Boolean(process.env.VERBOSE),
    });

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
            32 +
            8 +
            8 +
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
    const { extractableYield } = await client.details();
    expect(extractableYield.toNumber()).to.equal(0);
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

  // Seems not to work on local validator
  it.skip("can deposit a stake account to marinade", async () => {
    const deposit = new BN(100 * LAMPORTS_PER_SOL);
    // await getBalance(client); // print balance before deposit
    const stakeAccount = Keypair.generate();
    await initializeStakeAccount(client, stakeAccount, deposit);
    // Wait for cooling down period
    await waitForNextEpoch(client);
    await waitForNextEpoch(client);
    const info = await client.provider.connection.getAccountInfo(
      stakeAccount.publicKey
    );
    const balance = info?.lamports.toString();
    console.log("stake account balance: ", balance);

    const expectedMsol = Math.floor(
      deposit.toNumber() / client.marinadeState!.mSolPrice
    );

    try {
      await client.depositStakeAccount(stakeAccount.publicKey);
    } catch (err) {
      console.log(err);
    }

    await expectMSolTokenBalance(client, expectedMsol, 50);
    await expectStakerGSolTokenBalance(client, deposit.toNumber());
  });

  it("can deposit to blaze", async () => {
    const depositAmount = new BN(100 * LAMPORTS_PER_SOL);
    await getBalance(client);
    const bsolPrice = await getBsolPrice(client);

    const poolInfo = await getStakePoolAccount(
      client.provider.connection,
      client.blazeState!.pool
    );

    const solDepositFee =
      Number(poolInfo.solDepositFee.numerator) /
      Number(poolInfo.solDepositFee.denominator);
    expect(solDepositFee).to.equal(0.0008);

    const expectedBSol = Math.floor(depositAmount.toNumber() / bsolPrice);

    await client.depositToBlaze(depositAmount);

    await expectBSolTokenBalance(client, expectedBSol, 50);
    await expectStakerGSolTokenBalance(
      client,
      depositLamports.toNumber() + depositAmount.toNumber()
    );
  });

  // At present (TODO change) a Solblaze deposit does not
  // send 10% to the liquidity pool
  // the above deposit added 100SOL to the pool, bringing the pool to 200,
  // but left the amount in the LP at 10Sol
  // So after the previous deposit, the liquidity pool is at its minimum (5%)
  // Any subsequent liquid unstakes will trigger a rebalance
  // So to avoid this (in order to test feeless unstake)
  // we deposit 10 more here, which shoudl go straight into the LP, bringing it back up to its maximum (10%)
  it("deposits into the liquidity pool to rebalance the pools", async () => {
    await getBalance(client); // print balance before deposit

    // figure out what balances we expect before we make the deposit
    // since this is the first deposit, 10% will go into the liquidity pool
    // so the sunrise liquidity pool token balance should go up,
    // and the sunrise msol balance should be at 90% of the value of the deposit
    const lpPrice = await getLPPrice(client); // TODO should this be inverse price?
    const expectedLiqPool = Math.floor((20 * LAMPORTS_PER_SOL) / lpPrice);

    await client.deposit(new BN(10 * LAMPORTS_PER_SOL));

    await expectLiqPoolTokenBalance(client, expectedLiqPool, 50);
  });

  it("no yield to extract yet", async () => {
    const { extractableYield } = await client.details();
    expectAmount(extractableYield, 0, 10);
  });

  it("can feelessly unstake sol when under the level of the LP but above the min level that triggers a rebalance", async () => {
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

  it("can calculate the withdrawal fee if unstaking more than the LP balance", async () => {
    const details = await client.details();
    const liquidUnstakeFee = client.calculateWithdrawalFee(
      unstakeLamportsExceedLPBalance,
      details
    );

    // The LP balance is ~18 SOL at this point
    // The amount being unstaked is 20 SOL
    // However, the LP balance is made up of SOL and mSOL, so only the SOL share is available (~17.4 SOL)
    // So 17.4 SOL will be unstaked feelessly
    // the remaining 2.6 SOL is charged 0.3%
    // in addition, a rebalance will be triggered, which incurs the rent cost of the delayed unstake ticket
    // So the total fee will be roughly:
    // 2.6e9 * 0.003 + 1503360 + 5000 = 9.1e6
    // Actual values: ((20000000000-17448456901)* 0,003) + 1503360 + 5000 = 9162989.297
    // Tolerance to allow for rounding issues
    expectAmount(9162989, liquidUnstakeFee, 100);
  });

  it("can unstake sol with a liquid unstake fee when doing so exceeds the amount in the LP", async () => {
    log("Before big unstake");
    const details = await client.details();
    const liquidUnstakeFee = client.calculateWithdrawalFee(
      unstakeLamportsExceedLPBalance,
      details
    );

    const stakerPreSolBalance = await getBalance(client);

    const gsolBalance = await client.provider.connection.getTokenAccountBalance(
      client.stakerGSolTokenAccount!
    );

    await client.unstake(unstakeLamportsExceedLPBalance);

    log("after big unstake");
    await client.details();

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

  it("registers zero extractable yield while a rebalance is in-flight", async () => {
    // ensure in-flight SOL is counted as part of the total staked SOL when calculating extractable yield
    const { extractableYield } = await client.details();
    expectAmount(0, extractableYield, 10);
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

    let epochInfo = await client.provider.connection.getEpochInfo();
    log("current epoch", epochInfo.epoch);

    // unfortunately with the test validator, it is impossible to move the epoch forward without just waiting.
    // we run the validator at 32 slots per epoch, so we "only" need to wait for ~12 seconds
    // we wait 15 seconds to be safe
    // An alternative is to write rust tests using solana-program-test
    await waitForNextEpoch(client);

    epochInfo = await client.provider.connection.getEpochInfo();
    log("current epoch", epochInfo.epoch);

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
    const { extractableYield: yieldToExtractBefore } = await client.details();
    log("yield to extract before", yieldToExtractBefore.toString());

    await client.triggerRebalance();

    const { extractableYield: yieldToExtractAfter } = await client.details();
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

    const { extractableYield: preBurnYieldToExtract } = await client.details();
    log("pre-burn yield to extract", preBurnYieldToExtract.toString());

    // burn 100 gSOL so that there is some unclaimed yield for the crank operation to harvest
    await burnGSol(new BN(burnLamports), client);

    const { extractableYield: postBurnYieldToExtract } = await client.details();
    log("yield to extract", postBurnYieldToExtract.toString());

    // subtract 0.3% liquid unstake fee until we do delayed unstake
    const expectedYield = new BN(burnLamports).muln(997).divn(1000);

    expectAmount(postBurnYieldToExtract, expectedYield, 50);
  });

  it("can extract earned yield", async () => {
    await expectTreasurySolBalance(client, 0, 50);

    // trigger a withdrawal
    try {
      await client.extractYield();
    } catch (err) {
      console.log(err);
    }

    // expect the treasury to have 500 SOL minus fees
    // marinade charges a 0.3% fee for liquid unstaking
    const expectedTreasuryBalance = new BN(burnLamports).muln(997).divn(1000);
    await expectTreasurySolBalance(client, expectedTreasuryBalance, 10);
  });

  //
  // This test generates a situation where the liquidity pool balance is overfull, by adding fees to the pool.
  //
  it("can deposit sol after fees are sent to the liquidity pool, increasing the value of the liquidity pool tokens", async () => {
    if (!client.marinade) {
      throw new Error("Marinade state not initialized");
    }

    let details = await client.details();

    // deposit directly into marinade, and withdrawing again, in order to add fees to the pool
    // raising its value above the preferred amount.
    const marinadeConfig = new MarinadeConfig({
      connection: client.provider.connection,
      publicKey: client.provider.publicKey,
    });
    const marinade = new Marinade(marinadeConfig);

    log("LP Sol Value: ", details.lpDetails.lpSolValue.toNumber());
    // Simulate fees being sent to the liquidity pool
    log("Depositing directly into marinade");
    let { transaction } = await marinade.deposit(
      new BN(100000 * LAMPORTS_PER_SOL)
    );
    await client.provider.sendAndConfirm(transaction);
    log("Liquid unstaking from marinade, sending fees into the liquidity pool");
    ({ transaction } = await marinade.liquidUnstake(
      new BN(90000 * LAMPORTS_PER_SOL)
    ));
    await client.provider.sendAndConfirm(transaction);
    details = await client.details();
    log("LP Sol Value: ", details.lpDetails.lpSolValue.toNumber());
    log("preferred lp value", Number(details.balances.gsolSupply.amount) * 0.1);

    const liqPoolBalance =
      await client.provider.connection.getTokenAccountBalance(
        client.liqPoolTokenAccount!
      );

    await client.deposit(new BN(0.01 * LAMPORTS_PER_SOL));

    // the deposit should not increase the balance of the liquidity pool tokens
    await expectLiqPoolTokenBalance(
      client,
      new BN(liqPoolBalance.value.amount)
    );
  });
});
