import BN from "bn.js";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { SunriseStakeClient } from "../app/src/lib/client";
import {
  burnGSol, expectLiqPoolTokenBalance,
  expectMSolTokenBalance,
  expectStakerGSolTokenBalance,
  expectStakerSolBalance,
  expectTreasurySolBalance, networkFeeForConfirmedTransaction,
  getBalance, getLPPrice, calculateFee,
} from "./util";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { TicketAccount } from "@sunrisestake/app/src/lib/client/types/TicketAccount";
import {DEFAULT_LP_MIN_PROPORTION, DEFAULT_LP_PROPORTION} from "@sunrisestake/app/src/lib/constants";

chai.use(chaiAsPromised);

const { expect } = chai;
describe("sunrise-stake", () => {
  let client: SunriseStakeClient;

  const depositSOL = new BN(100_000_000_000); // Deposit 100 SOL
  const unstakeSOLUnderLPBalance = new BN(1_000_000_000); // 1 SOL
  const unstakeSOLExceedLPBalance = new BN(2_000_000_000); // 20 SOL
  const orderUnstakeSOL = new BN(2_000_000_000); // Order a delayed unstake of 2 SOL

  let treasury = Keypair.generate();
  let updateAuthority: Keypair;

  let delayedUnstakeTicket: TicketAccount;

  it.only("can register a new Sunrise state", async () => {
    client = await SunriseStakeClient.register(
        treasury.publicKey,
        Keypair.generate()
    );

    console.log(await client.details())
  });

  it.only("can update the state", async () => {
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
    expect(client.config?.liqPoolMinProportion).to.equal(DEFAULT_LP_MIN_PROPORTION);
  });

  it.only("can resize the state", async () => {
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

  it.only("can deposit sol", async () => {
    await getBalance(client); // print balance before deposit

    // figure out what balances we expect before we make the deposit
    // since this is the first deposit, 10% will go into the liquidity pool
    // so the sunrise liquidity pool token balance should go up,
    // and the sunrise msol balance should be at 90% of the value of the deposit
    const lpPrice = await getLPPrice(client); // TODO should this be inverse price?
    const expectedMsol = Math.floor(depositSOL.toNumber() * 0.9 / client.marinadeState!.mSolPrice);
    const expectedLiqPool = Math.floor(depositSOL.toNumber() * 0.1 / lpPrice);

    await client.deposit(depositSOL);

    await expectMSolTokenBalance(client, expectedMsol, 50);
    await expectLiqPoolTokenBalance(client, expectedLiqPool, 50);
    await expectStakerGSolTokenBalance(client, depositSOL.toNumber());
  });

  it.only("can feelessly unstake sol when under the level of the LP", async () => {
    const stakerPreSolBalance = await getBalance(client);

    await client.unstake(unstakeSOLUnderLPBalance);

    const expectedPostUnstakeBalance = stakerPreSolBalance
        .add(unstakeSOLUnderLPBalance);

    // use a tolerance here as the exact value depends on network fees
    // which, for the first few slots on the test validator, are
    // variable
    await expectStakerSolBalance(client, expectedPostUnstakeBalance, 50);
  });

  it("can unstake sol with a liquid unstake fee when doing so exceeds the amount in the LP", async () => {
    const lpSolValue = (await client.details()).lpDetails.lpSolValue;

    const stakerPreSolBalance = await getBalance(client);

    const gsolBalance = await client.provider.connection.getTokenAccountBalance(
        client.stakerGSolTokenAccount!
    );
    const unstakeResult = await client.unstake(unstakeSOLExceedLPBalance);

    await expectStakerGSolTokenBalance(
        client,
        new BN(gsolBalance.value.amount).sub(unstakeSOLExceedLPBalance)
    );

    const liquidUnstakeFee = await calculateFee(client, unstakeResult, lpSolValue, unstakeSOLExceedLPBalance)

    const expectedPostUnstakeBalance = stakerPreSolBalance
        .add(unstakeSOLExceedLPBalance)
        .sub(liquidUnstakeFee);

    // use a tolerance here as the exact value depends on network fees
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
    await expectStakerSolBalance(client, expectedPostUnstakeBalance, 100);
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
