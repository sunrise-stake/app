import BN from "bn.js";
import {Keypair, LAMPORTS_PER_SOL, SystemProgram} from "@solana/web3.js";
import {
  SunriseStakeClient,
  type TicketAccount,
  DEFAULT_LP_MIN_PROPORTION,
  DEFAULT_LP_PROPORTION,
  NETWORK_FEE,
  Environment,
  findImpactNFTMintAuthority,
} from "../client/src/index.js";
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
  getDelegatedAmount,
  log,
  waitForNextEpoch,
  expectBSolTokenBalance,
  initializeStakeAccount,
  impactNFTLevels,
} from "./util.js";
import { expect } from "chai";
import * as chai from 'chai';
import chaiAsPromised from "chai-as-promised";
import { MarinadeConfig, Marinade } from "@marinade.finance/marinade-ts-sdk";
import {
  blazeDepositLamports,
  blazeUnstakeLamports,
  burnLamports,
  depositLamports,
  lockLamports,
  marinadeStakeDeposit,
  orderUnstakeLamports,
  unstakeLamportsExceedLPBalance,
  unstakeLamportsUnderLPBalance,
} from "./constants.js";
import { ImpactNftClient } from "@sunrisestake/impact-nft-client";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

chai.use(chaiAsPromised);

describe.only("sunrise-stake", () => {
  let client: SunriseStakeClient;
  let updateAuthority: Keypair;
  let delayedUnstakeTicket: TicketAccount;

  let treasury = Keypair.generate();
  const mint = Keypair.generate();

  // when initially set up, the impact nft state is not yet created
  const initialClientEnvironment = {
    ...Environment.devnet,
    impactNFT: {
      state: undefined,
    },
  };

  it("can register a new Sunrise state", async () => {
    client = await SunriseStakeClient.register(
      treasury.publicKey,
      mint,
      initialClientEnvironment,
      {
        verbose: Boolean(process.env.VERBOSE),
      }
    );

    log(await client.details());
  });

  it("can update the state", async () => {
    treasury = Keypair.generate();
    updateAuthority = Keypair.generate();

      console.log("client's updateAuthority before update:", client.config?.updateAuthority.toBase58());

    await client.update({
      newTreasury: treasury.publicKey,
      newUpdateAuthority: updateAuthority.publicKey,
    });

      console.log("client's updateAuthority after update:", client.config?.updateAuthority.toBase58());

    await client.refresh()

      console.log("client's updateAuthority after refresh:", client.config?.updateAuthority.toBase58());

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
      console.log("updateAuthority:", updateAuthority.publicKey.toBase58());
      console.log("payer:", client.provider.publicKey.toBase58());
      console.log("client's updateAuthority:", client.config?.updateAuthority.toBase58());
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
      .accountsStrict({
        state: client.env.state,
        payer: client.provider.publicKey,
        updateAuthority: updateAuthority.publicKey.toBase58(),
        systemProgram: SystemProgram.programId.toBase58(),
      })
      .signers([updateAuthority])
      .rpc();
  });

  it("can create an impactNFT state with the mint authority derived from the sunrise state", async () => {
    const impactNftMintAuthority = findImpactNFTMintAuthority(
      client.config!
    )[0];
    const levelCount = 8;
    const levels = impactNFTLevels(levelCount);
    const impactNftClient = await ImpactNftClient.register(
      impactNftMintAuthority,
      levelCount
    );

    if (!impactNftClient.stateAddress)
      throw new Error("Impact NFT state not registered");

    const collections = await Promise.all(
      levels.map(async (level) =>
        impactNftClient.createCollectionMint(
          level.uri,
          level.name + " Collection"
        )
      )
    );

    const levelsWithOffsetAndCollections = levels.map((level, i) => ({
      ...level,
      // parse the offset string into a BN
      offset: new BN(level.offset),
      collectionMint: collections[i].publicKey,
    }));

    await impactNftClient.registerOffsetTiers(levelsWithOffsetAndCollections);

    // update the client with the new impact nft state
    client = await SunriseStakeClient.get(
      client.provider,
      WalletAdapterNetwork.Devnet,
      {
        environmentOverrides: {
          impactNFT: {
            state: impactNftClient.stateAddress,
          },
          state: client.env.state,
        },
        verbose: Boolean(process.env.VERBOSE),
      }
    );
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

  it("can trigger two rebalances in a row", async () => {
    await client.triggerRebalance();
    await client.triggerRebalance();
  });

  it("can deposit sol to marinade", async () => {
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

    await client.sendAndConfirmTransaction(
      await client.deposit(depositLamports)
    );

    await expectMSolTokenBalance(client, expectedMsol, 50);
    await expectLiqPoolTokenBalance(client, expectedLiqPool, 50);
    await expectStakerGSolTokenBalance(client, depositLamports.toNumber());
  });

  it("can deposit to blaze", async () => {
    await getBalance(client);
    const bsolPrice = await getBsolPrice(client);

    const expectedBSol = Math.floor(
      blazeDepositLamports.toNumber() / bsolPrice
    );

    await client.sendAndConfirmTransaction(
      await client.depositToBlaze(blazeDepositLamports)
    );

    await expectBSolTokenBalance(client, expectedBSol, 50);
    await expectStakerGSolTokenBalance(
      client,
      depositLamports.toNumber() + blazeDepositLamports.toNumber()
    );
  });
  //
  // // At present (TODO change) a Solblaze deposit does not
  // // send 10% to the liquidity pool
  // // the above deposit added 100SOL to the pool, bringing the pool to 200,
  // // but left the amount in the LP at 10Sol
  // // So after the previous deposit, the liquidity pool is at its minimum (5%)
  // // Any subsequent liquid unstakes will trigger a rebalance
  // // So to avoid this (in order to test feeless unstake)
  // // we deposit 10 more here, which should go straight into the LP, bringing it back up to its maximum (10%)
  // it("deposits into the liquidity pool to rebalance the pools", async () => {
  //   await getBalance(client); // print balance before deposit
  //
  //   // figure out what balances we expect before we make the deposit
  //   // since this is the first deposit, 10% will go into the liquidity pool
  //   // so the sunrise liquidity pool token balance should go up,
  //   // and the sunrise msol balance should be at 90% of the value of the deposit
  //   const lpPrice = await getLPPrice(client); // TODO should this be inverse price?
  //   const expectedLiqPool = Math.floor((20 * LAMPORTS_PER_SOL) / lpPrice);
  //
  //   await client.sendAndConfirmTransaction(
  //     await client.deposit(new BN(10 * LAMPORTS_PER_SOL))
  //   );
  //
  //   await expectLiqPoolTokenBalance(client, expectedLiqPool, 50);
  // });
  //
  // it("locks sol for the next epoch", async () => {
  //   await client.sendAndConfirmTransactions(
  //     await client.lockGSol(lockLamports),
  //     undefined,
  //     undefined,
  //     true
  //   );
  // });
  //
  // it("cannot re-lock", async () => {
  //   const shouldFail = client.sendAndConfirmTransactions(
  //     await client.lockGSol(lockLamports)
  //   );
  //
  //   return expect(shouldFail).to.be.rejected;
  // });
  //
  // it("no yield to extract yet", async () => {
  //   const { extractableYield } = await client.details();
  //   expectAmount(extractableYield, 0, 10);
  // });
  //
  // it("can feelessly unstake sol when under the level of the LP but above the min level that triggers a rebalance", async () => {
  //   const stakerPreSolBalance = await getBalance(client);
  //
  //   await client.sendAndConfirmTransaction(
  //     await client.unstake(unstakeLamportsUnderLPBalance)
  //   );
  //   await client.triggerRebalance();
  //
  //   const expectedPostUnstakeBalance = stakerPreSolBalance
  //     .add(unstakeLamportsUnderLPBalance)
  //     .subn(NETWORK_FEE * 2); // Because the transactions are now separated?
  //
  //   // use a tolerance here as the exact value depends on network fees
  //   // which, for the first few slots on the test validator, are
  //   // variable
  //   await expectStakerSolBalance(client, expectedPostUnstakeBalance, 100);
  // });
  //
  // it("can calculate the withdrawal fee if unstaking more than the LP balance", async () => {
  //   const details = await client.details();
  //   const { totalFee } = client.calculateWithdrawalFee(
  //     unstakeLamportsExceedLPBalance,
  //     details
  //   );
  //   await client.report();
  //   log("total withdrawal fee: ", totalFee.toString());
  //
  //   // The LP balance is ~18 SOL at this point
  //   // The amount being unstaked is 20 SOL
  //   // However, the LP balance is made up of SOL and mSOL, so only the SOL share is available (~17.4 SOL)
  //   // So 17.4 SOL will be unstaked feelessly
  //   // the remaining 2.6 SOL is charged 0.3%
  //   // in addition, a rebalance will be triggered, which incurs the rent cost of the delayed unstake ticket
  //   // So the total fee will be roughly:
  //   // 2.6e9 * 0.003 + 1503360 + 5000 = 9.1e6
  //   // Actual values: ((20000000000-17448456901)* 0,003) + 1503360 + 5000 = 9162989.297
  //   // Tolerance to allow for rounding issues
  //   // expectAmount(9162989, totalWithdrawalFee, 100);
  //
  //   // Liquid unstake comes completely from blaze here, charged at 0.03% rather than marinade's 0.3%
  //   // Unsure about if the rebalance works the same as it did prior. If it does, the new value should be:
  //   const expectedAmount =
  //     (20000000000 - details.lpDetails.lpSolShare.toNumber()) * 0.0003 +
  //     1503360 +
  //     2 * 5000;
  //
  //   expectAmount(totalFee, expectedAmount, 100);
  // });
  //
  // // Triggers a liquid unstake from Blaze only (since its valuation is higher)
  // it("liquid unstakes sol from the Blaze pool when its valuation exceeds Marinade's", async () => {
  //   const stakerPreSolBalance = await getBalance(client);
  //
  //   const gsolBalance = await client.provider.connection.getTokenAccountBalance(
  //     client.stakerGSolTokenAccount!
  //   );
  //
  //   let details = await client.details();
  //   const { totalFee } = client.calculateWithdrawalFee(
  //     blazeUnstakeLamports,
  //     details
  //   );
  //
  //   log(`Before unstake from blaze (${blazeUnstakeLamports.toString()}): `);
  //   await client.report();
  //
  //   await client.sendAndConfirmTransaction(
  //     await client.unstake(blazeUnstakeLamports)
  //   );
  //   await client.triggerRebalance();
  //
  //   const expectedPostUnstakeBalance = stakerPreSolBalance
  //     .add(blazeUnstakeLamports)
  //     .sub(totalFee);
  //
  //   log("after big unstake from blaze");
  //   await client.report();
  //
  //   await expectStakerGSolTokenBalance(
  //     client,
  //     new BN(gsolBalance.value.amount).sub(blazeUnstakeLamports)
  //   );
  //   await expectStakerSolBalance(client, expectedPostUnstakeBalance, 100);
  //
  //   details = await client.details();
  //   expect(details.epochReport.totalOrderedLamports.toNumber()).to.equal(
  //     7450000000
  //   );
  // });
  //
  // it("can unstake sol with a liquid unstake fee when doing so exceeds the amount in the LP", async () => {
  //   await waitForNextEpoch(client);
  //
  //   log("Before big unstake");
  //   const details = await client.details();
  //
  //   const { liquidUnstakeFee } = client.calculateWithdrawalFee(
  //     unstakeLamportsExceedLPBalance,
  //     details
  //   );
  //   const totalFees = liquidUnstakeFee.addn(2 * NETWORK_FEE);
  //
  //   const stakerPreSolBalance = await getBalance(client);
  //   const gsolBalance = await client.provider.connection.getTokenAccountBalance(
  //     client.stakerGSolTokenAccount!
  //   );
  //
  //   await client.report();
  //
  //   await client.sendAndConfirmTransaction(
  //     await client.unstake(unstakeLamportsExceedLPBalance)
  //   );
  //
  //   await client.triggerRebalance();
  //
  //   log("after big unstake");
  //   await client.report();
  //
  //   await expectStakerGSolTokenBalance(
  //     client,
  //     new BN(gsolBalance.value.amount).sub(unstakeLamportsExceedLPBalance)
  //   );
  //
  //   const expectedPostUnstakeBalance = stakerPreSolBalance
  //     .add(unstakeLamportsExceedLPBalance)
  //     .sub(totalFees);
  //
  //   // use a tolerance here as the exact value depends on network fees
  //   // which, for the first few slots on the test validator, are
  //   // variable, as well as floating point precision
  //   // Set the tolerance quite high here to compensate for fees for additional transfers
  //   await expectStakerSolBalance(
  //     client,
  //     expectedPostUnstakeBalance,
  //     NETWORK_FEE * 2
  //   );
  // });
  //
  // it("registers zero extractable yield while a rebalance is in-flight", async () => {
  //   // ensure in-flight SOL is counted as part of the total staked SOL when calculating extractable yield
  //   const { extractableYield } = await client.details();
  //   expectAmount(0, extractableYield, 10);
  // });
  //
  // it("can order a delayed unstake", async () => {
  //   const [transaction, keypairs] = await client.orderUnstake(
  //     orderUnstakeLamports
  //   );
  //   const txSig = await client.sendAndConfirmTransaction(transaction, keypairs);
  //   const blockhash = await client.provider.connection.getLatestBlockhash();
  //   await client.provider.connection.confirmTransaction({
  //     signature: txSig,
  //     ...blockhash,
  //   });
  //
  //   const delayedUnstakeTickets = await client.getDelayedUnstakeTickets();
  //
  //   expect(delayedUnstakeTickets.length).to.equal(1);
  //
  //   delayedUnstakeTicket = delayedUnstakeTickets[0];
  //
  //   // -1 due to rounding error in the program. TODO fix this
  //   expect(delayedUnstakeTicket.lamportsAmount.toString()).to.equal(
  //     orderUnstakeLamports.subn(1).toString()
  //   );
  // });
  //
  // it("cannot claim an unstake ticket until one epoch has passed", async () => {
  //   const shouldFail = client.sendAndConfirmTransaction(
  //     await client.claimUnstakeTicket(delayedUnstakeTicket)
  //   );
  //
  //   // TODO expose the error message from the program
  //   return expect(shouldFail).to.be.rejectedWith(
  //     "custom program error: 0x1103"
  //   );
  // });
  //
  // it("can claim an unstake ticket after one epoch has passed", async () => {
  //   const stakerPreSolBalance = await getBalance(client);
  //
  //   let epochInfo = await client.provider.connection.getEpochInfo();
  //   log("current epoch", epochInfo.epoch);
  //
  //   // unfortunately with the test validator, it is impossible to move the epoch forward without just waiting.
  //   // we run the validator at 32 slots per epoch, so we "only" need to wait for ~12 seconds
  //   // An alternative is to write rust tests using solana-program-test
  //   await waitForNextEpoch(client);
  //
  //   epochInfo = await client.provider.connection.getEpochInfo();
  //   log("current epoch", epochInfo.epoch);
  //
  //   const sunriseLamports = await client.provider.connection
  //     .getAccountInfo(delayedUnstakeTicket.address)
  //     .then((account) => account?.lamports);
  //   const marinadeLamports = await client.provider.connection
  //     .getAccountInfo(delayedUnstakeTicket.marinadeTicketAccount)
  //     .then((account) => account?.lamports);
  //
  //   log(
  //     "total reclaimed rent: ",
  //     sunriseLamports,
  //     marinadeLamports,
  //     (sunriseLamports ?? 0) + (marinadeLamports ?? 0)
  //   );
  //   log("ticket size: ", orderUnstakeLamports.toString());
  //   log("existing balance", stakerPreSolBalance.toString());
  //   log(
  //     "existing balance plus reclaimed rent",
  //     stakerPreSolBalance
  //       .addn(sunriseLamports ?? 0)
  //       .addn(marinadeLamports ?? 0)
  //       .toString()
  //   );
  //
  //   await client.sendAndConfirmTransaction(
  //     await client.claimUnstakeTicket(delayedUnstakeTicket)
  //   );
  //
  //   // the staker does not get the marinade ticket rent
  //   const expectedPostUnstakeBalance = stakerPreSolBalance
  //     .add(orderUnstakeLamports)
  //     .addn(sunriseLamports ?? 0)
  //     .subn(5000);
  //   await expectStakerSolBalance(client, expectedPostUnstakeBalance, 100);
  // });
  //
  // it("can recover previous epoch rebalance tickets by triggering a new rebalance", async () => {
  //   const {
  //     extractableYield: yieldToExtractBefore,
  //     epochReport: epochReportBefore,
  //   } = await client.details();
  //   log("yield to extract before", yieldToExtractBefore.toString());
  //   log(
  //     "yield to extract before (in epoch report)",
  //     epochReportBefore.extractableYield.toString()
  //   );
  //   log("tickets to recover: ", epochReportBefore.tickets.toString());
  //   await client.report();
  //
  //   await client.triggerRebalance();
  //
  //   const { extractableYield: yieldToExtractAfter } = await client.details();
  //   log("\n\n====================\n\n");
  //   log("yield to extract after", yieldToExtractAfter.toString());
  //
  //   // the epoch report account has now been updated to the current epoch and all tickets have been claimed
  //   const currentEpoch =
  //     await client.program.provider.connection.getEpochInfo();
  //   const details = await client.details();
  //   expect(details.epochReport.epoch.toNumber()).to.equal(currentEpoch.epoch);
  //   expect(details.epochReport.tickets.toNumber()).to.equal(0);
  //   expect(details.epochReport.totalOrderedLamports.toNumber()).to.equal(0);
  //   expect(details.epochReport.extractableYield.toNumber()).to.equal(0);
  // });
  //
  // it("can detect yield to extract", async () => {
  //   // deposit 1000 SOL, then burn 100 gSOL so there is some earned yield
  //   // Note - we have to do this as we do not have the ability to increase the msol value
  //   const depositedLamports = 1000 * LAMPORTS_PER_SOL;
  //
  //   await client.sendAndConfirmTransaction(
  //     await client.deposit(new BN(depositedLamports))
  //   );
  //
  //   log(
  //     "gsol supply:",
  //     await client.provider.connection.getTokenSupply(client.config!.gsolMint)
  //   );
  //
  //   const { extractableYield: preBurnYieldToExtract } = await client.details();
  //   log("pre-burn yield to extract", preBurnYieldToExtract.toString());
  //
  //   // burn 100 gSOL so that there is some unclaimed yield for the crank operation to harvest
  //   await burnGSol(new BN(burnLamports), client);
  //
  //   const { extractableYield: postBurnYieldToExtract } = await client.details();
  //   log("yield to extract", postBurnYieldToExtract.toString());
  //
  //   // subtract 0.3% liquid unstake fee until we do delayed unstake
  //   const expectedYield = new BN(burnLamports).muln(997).divn(1000);
  //
  //   const details = await client.details();
  //   log("details", details);
  //
  //   expectAmount(postBurnYieldToExtract, expectedYield, 50);
  // });
  //
  // it("can update the epoch report to reflect the extractable yield", async () => {
  //   // current epoch report shows zero extractable yield
  //   let details = await client.details();
  //   expect(details.epochReport.extractableYield.toNumber()).to.equal(0);
  //
  //   // update the epoch report
  //   await client.updateEpochReport();
  //
  //   // now the epoch report reflects the yield
  //   details = await client.details();
  //   const reportedYield = details.epochReport.extractableYield;
  //   // the on-chain recorded yield is not including the marinade withdrawal fee
  //   // TODO fix
  //   const reportedYieldLessFee = reportedYield.muln(997).divn(1000);
  //   expect(reportedYieldLessFee.toNumber()).to.equal(
  //     details.extractableYield.toNumber() // calculated on the client
  //   );
  // });
  //
  // it("cannot extract yield while the epoch report is still pointing to the previous epoch", async () => {
  //   await waitForNextEpoch(client);
  //
  //   const currentEpoch = await client.provider.connection.getEpochInfo();
  //   const details = await client.details();
  //
  //   // epoch report is still on the last epoch
  //   expect(details.epochReport.epoch.toNumber()).to.equal(
  //     currentEpoch.epoch - 1
  //   );
  //
  //   // so extract yield will fail
  //   await expect(client.extractYield()).to.be.rejected;
  // });
  //
  // it("can unlock sol (including a recoverTickets call)", async () => {
  //   await client.sendAndConfirmTransactions(
  //     await client.unlockGSol(),
  //     undefined,
  //     undefined,
  //     true
  //   );
  //
  //   // the epoch report has now been updated to the current epoch
  //   const currentEpoch = await client.provider.connection.getEpochInfo();
  //   const details = await client.details();
  //   expect(details.epochReport.epoch.toNumber()).to.equal(currentEpoch.epoch);
  //
  //   // and the lock account for the user has been updated to add the yield that their locked gsol accrued
  //   const { lockAccount } = await client.getLockAccount();
  //
  //   // calculate the expected locked yield:
  //   // yield accrued
  //   const expectedYield = details.extractableYield; // new BN(burnLamports).muln(997).divn(1000);
  //   // locked amount as a proportion of the total supply:
  //   const lockedProportion =
  //     lockLamports.toNumber() / Number(details.balances.gsolSupply.amount);
  //   // expected yield * locked proportion
  //   const expectedLockedYield = expectedYield.toNumber() * lockedProportion;
  //
  //   console.log("locked proportion", lockedProportion);
  //   console.log("expected yield", expectedYield.toString());
  //   console.log("expected locked yield", expectedLockedYield);
  //
  //   expectAmount(lockAccount!.yieldAccruedByOwner, expectedLockedYield, 50);
  // });
  //
  // it("can re-lock after unlock", async () => {
  //   await client.sendAndConfirmTransactions(
  //     await client.lockGSol(lockLamports),
  //     undefined,
  //     undefined,
  //     true
  //   );
  //
  //   const { tokenAccount } = await client.getLockAccount();
  //   expectAmount(new BN(tokenAccount!.amount.toString()), lockLamports, 0);
  // });
  //
  // it("calculates yield accrued by owner correctly after relocking", async () => {
  //   let details = await client.details();
  //   let { lockAccount } = await client.getLockAccount();
  //
  //   const previousExtractableYield = details.extractableYield;
  //   const previousAccruedYield = lockAccount?.yieldAccruedByOwner;
  //
  //   // burn 100 gSOL so that there is some unclaimed yield for the crank operation to harvest
  //   await burnGSol(new BN(burnLamports), client);
  //   await waitForNextEpoch(client);
  //   await client.sendAndConfirmTransactions(await client.updateLockAccount());
  //
  //   details = await client.details();
  //   lockAccount = (await client.getLockAccount()).lockAccount;
  //
  //   const expectedYield = details.extractableYield.sub(
  //     previousExtractableYield
  //   );
  //   const lockedProportion =
  //     lockLamports.toNumber() / Number(details.balances.gsolSupply.amount);
  //   // expected yield * locked proportion
  //   const expectedLockedYield = expectedYield.toNumber() * lockedProportion;
  //
  //   expectAmount(
  //     lockAccount!.yieldAccruedByOwner,
  //     expectedLockedYield + previousAccruedYield!.toNumber(),
  //     50
  //   );
  // });
  //
  // it("can add locked after re-lock after unlock", async () => {
  //   await client.sendAndConfirmTransactions(
  //     await client.addLockedGSol(lockLamports),
  //     undefined,
  //     undefined,
  //     true
  //   );
  //
  //   const { tokenAccount } = await client.getLockAccount();
  //   expectAmount(
  //     new BN(tokenAccount!.amount.toString()),
  //     lockLamports.add(lockLamports),
  //     0
  //   );
  // });
  //
  // it("calculates yield accrued by owner correctly after adding more locked gSOL", async () => {
  //   let details = await client.details();
  //   let { lockAccount } = await client.getLockAccount();
  //
  //   const previousExtractableYield = details.extractableYield;
  //   const previousAccruedYield = lockAccount?.yieldAccruedByOwner;
  //
  //   // burn 100 gSOL so that there is some unclaimed yield for the crank operation to harvest
  //   await burnGSol(new BN(burnLamports), client);
  //   await waitForNextEpoch(client);
  //   await client.sendAndConfirmTransactions(await client.updateLockAccount());
  //
  //   details = await client.details();
  //   lockAccount = (await client.getLockAccount()).lockAccount;
  //
  //   const expectedYield = details.extractableYield.sub(
  //     previousExtractableYield
  //   );
  //   const lockedProportion =
  //     (2 * lockLamports.toNumber()) /
  //     Number(details.balances.gsolSupply.amount);
  //   // expected yield * locked proportion
  //   const expectedLockedYield = expectedYield.toNumber() * lockedProportion;
  //
  //   expectAmount(
  //     lockAccount!.yieldAccruedByOwner,
  //     expectedLockedYield + previousAccruedYield!.toNumber(),
  //     50
  //   );
  // });
  //
  // it("can extract earned yield", async () => {
  //   await expectTreasurySolBalance(client, 0, 50);
  //
  //   // trigger a withdrawal
  //   await client.extractYield();
  //
  //   // expect the treasury to have 500 SOL minus fees
  //   // marinade charges a 0.3% fee for liquid unstaking
  //   const expectedTreasuryBalance = new BN(burnLamports)
  //     .muln(3)
  //     .muln(997)
  //     .divn(1000);
  //   await expectTreasurySolBalance(client, expectedTreasuryBalance, 10);
  // });
  //
  // //
  // // This test generates a situation where the liquidity pool balance is overfull, by adding fees to the pool.
  // //
  // it("can deposit sol after fees are sent to the liquidity pool, increasing the value of the liquidity pool tokens", async () => {
  //   if (!client.marinade) {
  //     throw new Error("Marinade state not initialized");
  //   }
  //
  //   let details = await client.details();
  //
  //   // deposit directly into marinade, and withdrawing again, in order to add fees to the pool
  //   // raising its value above the preferred amount.
  //   const marinadeConfig = new MarinadeConfig({
  //     connection: client.provider.connection,
  //     publicKey: client.provider.publicKey,
  //   });
  //   const marinade = new Marinade(marinadeConfig);
  //
  //   log("LP Sol Value: ", details.lpDetails.lpSolValue.toNumber());
  //   // Simulate fees being sent to the liquidity pool
  //   log("Depositing directly into marinade");
  //   let { transaction } = await marinade.deposit(
  //     new BN(100000 * LAMPORTS_PER_SOL)
  //   );
  //   await client.provider.sendAndConfirm(transaction);
  //   log("Liquid unstaking from marinade, sending fees into the liquidity pool");
  //   ({ transaction } = await marinade.liquidUnstake(
  //     new BN(90000 * LAMPORTS_PER_SOL)
  //   ));
  //   await client.provider.sendAndConfirm(transaction);
  //   details = await client.details();
  //   log("LP Sol Value: ", details.lpDetails.lpSolValue.toNumber());
  //   log("preferred lp value", Number(details.balances.gsolSupply.amount) * 0.1);
  //
  //   const liqPoolBalance =
  //     await client.provider.connection.getTokenAccountBalance(
  //       client.liqPoolTokenAccount!
  //     );
  //
  //   await client.sendAndConfirmTransaction(
  //     await client.deposit(new BN(0.01 * LAMPORTS_PER_SOL))
  //   );
  //
  //   // the deposit should not increase the balance of the liquidity pool tokens
  //   await expectLiqPoolTokenBalance(
  //     client,
  //     new BN(liqPoolBalance.value.amount)
  //   );
  // });
  //
  // it.skip("can deposit a stake account to marinade", async () => {
  //   const stakeAccount = Keypair.generate();
  //   await initializeStakeAccount(client, stakeAccount, marinadeStakeDeposit);
  //
  //   let info = await client.provider.connection.getAccountInfo(
  //     stakeAccount.publicKey
  //   );
  //   let balance = info?.lamports.toString();
  //   console.log("stake account balance: ", balance);
  //
  //   // Wait for cooling down period
  //   await waitForNextEpoch(client);
  //   await waitForNextEpoch(client);
  //
  //   const delegatedStake = await getDelegatedAmount(
  //     client,
  //     stakeAccount.publicKey
  //   );
  //   log("delegated amount: ", delegatedStake.toNumber());
  //
  //   const initialMsolBalance = Number(
  //     (await client.balance()).msolBalance.amount
  //   );
  //   log("balance from client: ", initialMsolBalance);
  //
  //   const initialStakerGsolBalance = (
  //     await client.provider.connection.getTokenAccountBalance(
  //       client.stakerGSolTokenAccount!
  //     )
  //   ).value.amount;
  //
  //   const expectedMsolIncrease = Math.floor(
  //     delegatedStake.toNumber() / client.marinadeState!.mSolPrice
  //   );
  //   log("Expected msol increase: ", expectedMsolIncrease);
  //
  //   await client.depositStakeAccount(stakeAccount.publicKey);
  //
  //   info = await client.provider.connection.getAccountInfo(
  //     stakeAccount.publicKey
  //   );
  //   balance = info?.lamports.toString();
  //   log("stake account balance: ", balance);
  //
  //   await expectMSolTokenBalance(
  //     client,
  //     initialMsolBalance + expectedMsolIncrease,
  //     50
  //   );
  //   await expectStakerGSolTokenBalance(
  //     client,
  //     Number(initialStakerGsolBalance) + Number(delegatedStake)
  //   );
  // });
  //
  // it("can deposit sol to marinade for someone else", async () => {
  //   const recipient = Keypair.generate();
  //   const lamportsToSend = new BN(100_000);
  //   await client.sendAndConfirmTransaction(
  //     await client.deposit(lamportsToSend, recipient.publicKey)
  //   );
  //
  //   const recipientTokenAccountAddress = getAssociatedTokenAddressSync(
  //     client.config!.gsolMint,
  //     recipient.publicKey
  //   );
  //   const gsolBalance = await client.provider.connection.getTokenAccountBalance(
  //     recipientTokenAccountAddress
  //   );
  //   log("Recipient's gSOL balance", gsolBalance.value.uiAmount);
  //   expect(gsolBalance.value.amount).to.equal(lamportsToSend.toString());
  // });
  //
  // it("can deposit sol to spl for someone else", async () => {
  //   const recipient = Keypair.generate();
  //   const lamportsToSend = new BN(100_000);
  //   await client.sendAndConfirmTransaction(
  //     await client.depositToBlaze(lamportsToSend, recipient.publicKey)
  //   );
  //
  //   const recipientTokenAccountAddress = getAssociatedTokenAddressSync(
  //     client.config!.gsolMint,
  //     recipient.publicKey
  //   );
  //   const gsolBalance = await client.provider.connection.getTokenAccountBalance(
  //     recipientTokenAccountAddress
  //   );
  //   log("Recipient's gSOL balance", gsolBalance.value.uiAmount);
  //   expect(gsolBalance.value.amount).to.equal(lamportsToSend.toString());
  // });
});
