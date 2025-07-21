import { Keypair } from "@solana/web3.js";
import { SunriseStakeClient, NETWORK_FEE } from "@sunrisestake/client";
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

describe("unlock-recover-tickets-fails", () => {
  let client: SunriseStakeClient;
  let clientsInitialLockedGSolBalance: number;
  let clientsInitialUnlockedGSolBalance: number;

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

    log("Fetching locked gSOL balance...");
    clientsInitialLockedGSolBalance =
      (await client.details()).lockDetails?.amountLocked.toNumber() ?? 0;
    clientsInitialUnlockedGSolBalance = new BN(
      (await client.balance()).gsolBalance.amount
    ).toNumber();

    log("Initial locked gSOL balance:", clientsInitialLockedGSolBalance);
    log("Initial unlocked gSOL balance:", clientsInitialUnlockedGSolBalance);
  });

  it("can unlock gSOL even when recoverTickets fails", async () => {
    log("Attempting to unlock gSOL...");

    // This test uses mainnet state where recoverTickets is expected to fail
    // (e.g., due to missing ticket accounts). The unlock should still proceed
    // because stopOnFirstFailure is set to false.
    await client.sendAndConfirmTransactions(
      await client.unlockGSol(),
      undefined,
      undefined,
      true,
      false // stopOnFirstFailure = false to allow unlock to proceed even if recoverTickets fails
    );

    // assert the new gsol balance is equal to the sum of initial locked and unlocked gsol balances
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
  });

  it("can unstake gSOL", async () => {
    // ensure the user, after unlocking their gSOL, can unstake it
    log("Getting users's current SOL balance");
    const solBalance = await client.provider.connection.getBalance(
      client.provider.publicKey
    );
    console.log("SOL Balance:", solBalance);

    // now we have unlocked, we should be able to unstake all the gSOL
    const amountToUnstake =
      clientsInitialLockedGSolBalance + clientsInitialUnlockedGSolBalance;

    log("Attempting to unstake gSOL...");
    await client.sendAndConfirmTransaction(
      await client.unstake(new BN(amountToUnstake))
    );

    log("Getting user's SOL balance after unstaking");
    const newSolBalance = await client.provider.connection.getBalance(
      client.provider.publicKey
    );
    console.log("New SOL Balance:", newSolBalance);

    const expectedSolBalance = solBalance + amountToUnstake - NETWORK_FEE;
    console.log("Expected SOL Balance after unstaking:", expectedSolBalance);

    expectAmount(newSolBalance, expectedSolBalance, 1);
  });
});
