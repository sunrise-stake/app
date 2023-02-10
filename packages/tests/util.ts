import {
  type SunriseStakeClient,
  SOLBLAZE_CONFIG,
  getStakePoolAccount,
} from "../client/src";
import {
  Keypair,
  PublicKey,
  StakeProgram,
  Transaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import BN from "bn.js";
import { expect } from "chai";
import { createBurnInstruction } from "@solana/spl-token";
import * as fs from "fs";
import { MarinadeUtils } from "@sunrisestake/marinade-ts-sdk";


// Set in anchor.toml
const SLOTS_IN_EPOCH = 32;

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
  log("Staker's gSOL balance", gsolBalance.value.uiAmount);
  expect(gsolBalance.value.amount).to.equal(new BN(amount).toString());
};

export const expectAmount = (
  actualAmount: number | BN,
  expectedAmount: number | BN,
  tolerance = 0
) => {
  const actualAmountBN = new BN(actualAmount);
  const minExpected = new BN(expectedAmount).subn(tolerance);
  const maxExpected = new BN(expectedAmount).addn(tolerance);

  log(
    "Expecting",
    actualAmountBN.toString(),
    "to be at least",
    new BN(minExpected).toString(),
    "and at most",
    new BN(maxExpected).toString()
  );

  expect(actualAmountBN.gte(minExpected)).to.be.true;
  expect(actualAmountBN.lte(maxExpected)).to.be.true;
};

// LP Price = ( sol leg + msol leg * msol price ) / lp supply
// Note - this is approximate as the price may be out of date
export const getLPPrice = async (client: SunriseStakeClient) => {
  const lpMintInfo = await client.marinadeState!.lpMint.mintInfo();
  const lpSupply = lpMintInfo.supply;
  const lpSolLeg = await client.marinadeState!.solLeg();
  const lpSolLegBalance = await client.provider.connection.getBalance(lpSolLeg);
  const rentExemptReserveForTokenAccount = 2039280;
  const solBalance = lpSolLegBalance - rentExemptReserveForTokenAccount;

  const lpMsolLeg = client.marinadeState!.mSolLeg;
  const lpMsolLegBalance =
    await client.provider.connection.getTokenAccountBalance(lpMsolLeg);

  const msolPrice = client.marinadeState!.mSolPrice;

  const msolValue = Number(lpMsolLegBalance.value.amount) * msolPrice;

  const lpPrice = (solBalance + msolValue) / Number(lpSupply);

  log("LP sol leg balance", lpSolLegBalance);
  log("LP msol leg balance", lpMsolLegBalance.value.amount);
  log("Msol price", msolPrice);

  log("sol leg", solBalance);
  log("msol leg", msolValue);

  log("LP supply", lpSupply);
  log("LP price", lpPrice);

  return lpPrice;
};

export const expectMSolTokenBalance = async (
  client: SunriseStakeClient,
  expectedAmount: number | BN,
  tolerance = 0 // Allow for a tolerance as the msol calculation is inaccurate. The test uses the price which has limited precision
) => {
  const msolBalance = await client.provider.connection.getTokenAccountBalance(
    client.msolTokenAccount!
  );
  log("mSOL balance", msolBalance.value.amount);
  expectAmount(new BN(msolBalance.value.amount), expectedAmount, tolerance);
};

export const expectBSolTokenBalance = async (
  client: SunriseStakeClient,
  expectedAmount: number | BN,
  tolerance = 0
) => {
  const bsolBalance = await client.provider.connection.getTokenAccountBalance(
    client.bsolTokenAccount!
  );
  expectAmount(new BN(bsolBalance.value.amount), expectedAmount, tolerance);
};

export const expectLiqPoolTokenBalance = async (
  client: SunriseStakeClient,
  expectedAmount: number | BN,
  tolerance = 0 // Allow for a tolerance as the liq pool price calculation is inaccurate. The test uses the price which has limited precision
) => {
  const liqPoolBalance =
    await client.provider.connection.getTokenAccountBalance(
      client.liqPoolTokenAccount!
    );
  log("LiqPool balance", liqPoolBalance.value.amount);
  log("Expected amount", expectedAmount);
  expectAmount(new BN(liqPoolBalance.value.amount), expectedAmount, tolerance);
};

export const getBalance = async (client: SunriseStakeClient): Promise<BN> => {
  const balance = await client.provider.connection.getBalance(client.staker);
  log("Staker SOL balance", balance);
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
  log("Treasury SOL balance", treasuryBalance);
  expectAmount(treasuryBalance, expectedAmount, tolerance);
};

export const networkFeeForConfirmedTransaction = async (
  client: SunriseStakeClient,
  txSig: string
) => {
  await client.provider.connection.confirmTransaction(txSig, "confirmed");
  const tx = await client.provider.connection.getParsedTransaction(
    txSig,
    "confirmed"
  );
  return tx!.meta!.fee;
};

export const log = (...args: any[]) => {
  Boolean(process.env.VERBOSE) && console.log(...args);
};

export const waitForNextEpoch = async (client: SunriseStakeClient) => {
  const startingEpoch = await client.provider.connection.getEpochInfo();
  const nextEpoch = startingEpoch.epoch + 1;
  log("Waiting for epoch", nextEpoch);

  const startSlot = startingEpoch.slotIndex;

  let subscriptionId = 0;

  await new Promise((resolve) => {
    subscriptionId = client.provider.connection.onSlotChange((slotInfo) => {
      log("slot", slotInfo.slot, "startSlot", startSlot);

      if (slotInfo.slot % SLOTS_IN_EPOCH === 1 && slotInfo.slot > startSlot) {
        void client.provider.connection.getEpochInfo().then((currentEpoch) => {
          log("currentEpoch", currentEpoch);
          if (currentEpoch.epoch === nextEpoch) {
            resolve(slotInfo.slot);
          }
        });
      }
    });
  });

  await client.provider.connection.removeSlotChangeListener(subscriptionId);
};

export const getBsolPrice = async (
  client: SunriseStakeClient
): Promise<number> => {
  const accountInfo = await getStakePoolAccount(
    client.provider.connection,
    SOLBLAZE_CONFIG.pool
  );

  const price =
    Number(accountInfo.totalLamports) / Number(accountInfo.poolTokenSupply);
  log("BSol price: ", price);
  return price;
};

export const getBlazeWithdrawalFee = async (
  client: SunriseStakeClient
): Promise<number> => {
  const poolInfo = await getStakePoolAccount(
    client.provider.connection,
    client.blazeState!.pool
  );

  const solWithdrawalFee =
    Number(poolInfo.solWithdrawalFee.numerator) /
    Number(poolInfo.solWithdrawalFee.denominator);

  return solWithdrawalFee;
}

export const getBlazeSolDepositFee = async (
  client: SunriseStakeClient
): Promise<number> => {
  const poolInfo = await getStakePoolAccount(
    client.provider.connection,
    client.blazeState!.pool
  );

  const depositFee =
    Number(poolInfo.solDepositFee.numerator) /
    Number(poolInfo.solDepositFee.denominator);

  return depositFee;
}

export const toSol = (value: number): number => {
  return value / LAMPORTS_PER_SOL;
}

export const initializeStakeAccount = async (
  client: SunriseStakeClient,
  stakeAccount: Keypair,
  lamports: BN
) => {
  // const validatorRecord = await client.marinadeState?.getValidatorRecords();
  // console.log("validator record: ", validatorRecord);

  const authorized = {
    staker: client.provider.publicKey,
    withdrawer: client.provider.publicKey,
  };

  const createParams = {
    fromPubkey: client.provider.publicKey,
    stakePubkey: stakeAccount.publicKey,
    authorized,
    lamports: lamports.toNumber(),
  };
  const createIx = StakeProgram.createAccount(createParams);

  await client.provider.sendAndConfirm(new Transaction().add(createIx), [
    stakeAccount,
  ]);

  const voteKeypair = getKeypair(
    ".anchor/test-ledger/vote-account-keypair.json"
  );
  const votePubkey = voteKeypair.publicKey;

  const delegateParams = {
    stakePubkey: stakeAccount.publicKey,
    authorizedPubkey: client.provider.publicKey,
    votePubkey,
  };

  const delegateIx = StakeProgram.delegate(delegateParams);
  await client.provider.sendAndConfirm(new Transaction().add(delegateIx), []);

  const stakeAccountInfo = await MarinadeUtils.getParsedStakeAccountInfo(
    client.marinade!.provider,
    stakeAccount.publicKey
  );
  console.log("stakeAccountInfo: ", stakeAccountInfo);
};

const getKeypair = (filePath: string): Keypair => {
  const secretKeyString = fs.readFileSync(filePath, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
};

export async function getDelegatedAmount(
  client: SunriseStakeClient,
  stakeAccount: PublicKey
): Promise<BN> {
  const { value: stakeAccountInfo } =
    await client.provider.connection.getParsedAccountInfo(stakeAccount);

  if (!stakeAccountInfo) {
    throw new Error(`Failed getting stake account info`);
  }

  if (
    stakeAccountInfo.data === null ||
    stakeAccountInfo.data instanceof Buffer
  ) {
    throw new Error("Failed to parse the stake account data");
  }

  const { parsed: parsedData } = stakeAccountInfo.data;

  const delegation = parsedData?.info?.stake?.delegation.stake ?? null;
  return new BN(delegation);
}
