import { Keypair } from "@solana/web3.js";
import { SunriseStakeClient } from "@sunrisestake/client";
import { expectAmount, log } from "../../util.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import * as anchor from "@coral-xyz/anchor";
import bs58 from "bs58";
import dotenv from "dotenv";
import BN from "bn.js";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
dotenv.config();

describe("update-nft-fallback", () => {
  let client: SunriseStakeClient;
  let clientsInitialLockedGSolBalance: number;
  let clientsInitialUnlockedGSolBalance: number;
  let initialUpdatedToEpoch: number;

  before(async () => {
    // Load the private key from environment variable
    const privateKeyBase58 = process.env.SCENARIO_TEST_PRIVATE_KEY;
    if (privateKeyBase58 === undefined) {
      throw new Error("SCENARIO_TEST_PRIVATE_KEY environment variable not set");
    }

    // Convert base58 private key to Keypair
    const privateKeyBytes = bs58.decode(privateKeyBase58);
    const userWallet = Keypair.fromSecretKey(privateKeyBytes);

    const connection = new anchor.web3.Connection(
      "http://localhost:8899",
      "confirmed"
    );
    const wallet = new anchor.Wallet(userWallet);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    client = await SunriseStakeClient.get(
      provider,
      WalletAdapterNetwork.Mainnet,
      {
        verbose: Boolean(process.env.VERBOSE),
      }
    );

    log("Client initialized for user:", client.provider.publicKey.toBase58());

    const details = await client.details();
    log("Fetching locked gSOL balance...");
    clientsInitialLockedGSolBalance =
      details.lockDetails?.amountLocked.toNumber() ?? 0;
    clientsInitialUnlockedGSolBalance = new BN(
      (await client.balance()).gsolBalance.amount
    ).toNumber();

    initialUpdatedToEpoch = details.lockDetails?.updatedToEpoch.toNumber() ?? 0;

    log("Initial locked gSOL balance:", clientsInitialLockedGSolBalance);
    log("Initial unlocked gSOL balance:", clientsInitialUnlockedGSolBalance);
    log("Initial updatedToEpoch:", initialUpdatedToEpoch);
    log("Current epoch:", details.currentEpoch.epoch);

    // Verify that the lock account needs updating
    if (initialUpdatedToEpoch >= details.currentEpoch.epoch) {
      throw new Error(
        "Lock account is already up to date. This scenario requires an outdated lock account."
      );
    }
  });

  it("falls back to updateLockAccountWithoutNft when NFT update fails", async () => {
    log("Attempting to unlock gSOL with NFT fallback...");

    // This test assumes the NFT account is invalid (burned/transferred)
    // The updateLockAccount should catch the error and fall back to updateLockAccountWithoutNft

    const transactions = await client.unlockGSol();
    log("Number of transactions:", transactions.length);

    // We expect at least 2 transactions (update + unlock)
    chai.expect(transactions.length).to.be.at.least(2);

    // Send all transactions - should succeed despite NFT issue
    await client.sendAndConfirmTransactions(
      transactions,
      undefined,
      undefined,
      true,
      true // stopOnFirstFailure = true, but fallback should handle NFT error
    );

    // Verify the lock account was updated (even without NFT)
    const postDetails = await client.details();
    const newUpdatedToEpoch =
      postDetails.lockDetails?.updatedToEpoch.toNumber() ?? 0;
    log("New updatedToEpoch:", newUpdatedToEpoch);
    log("Current epoch:", postDetails.currentEpoch.epoch);

    // The lock account should now be updated to the current epoch
    chai.expect(newUpdatedToEpoch).to.equal(postDetails.currentEpoch.epoch);

    // Assert the new gsol balance is equal to the sum of initial locked and unlocked gsol balances
    const newGSolBalance = new BN(
      (await client.balance()).gsolBalance.amount
    ).toNumber();
    log("New gSOL Balance:", newGSolBalance);
    log(
      "Expected gSOL Balance after unlock:",
      clientsInitialLockedGSolBalance + clientsInitialUnlockedGSolBalance
    );
    expectAmount(
      newGSolBalance,
      clientsInitialLockedGSolBalance + clientsInitialUnlockedGSolBalance
    );

    // Verify the lock account is now unlocked
    const finalLockDetails = postDetails.lockDetails;
    chai.expect(finalLockDetails).to.be.null;
  });
});
