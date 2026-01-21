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

describe("spl-rebalance-liquid-transfer", () => {
  let client: SunriseStakeClient;
  let initialBlazeMintedGsol: BN;
  let initialMarinadeMintedGsol: BN;
  let initialBsolBalance: BN;
  let initialLpBalance: BN;

  before(async () => {
    // Load the admin private key from environment variable
    const privateKeyBase58 = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKeyBase58) {
      throw new Error("ADMIN_PRIVATE_KEY not set in .env");
    }

    // Convert base58 private key to Keypair
    const privateKeyBytes = bs58.decode(privateKeyBase58);
    const adminWallet = Keypair.fromSecretKey(privateKeyBytes);

    const connection = new anchor.web3.Connection(
      "http://localhost:8899",
      "confirmed"
    );
    const wallet = new anchor.Wallet(adminWallet);
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

    log("Client initialized for admin:", client.provider.publicKey.toBase58());

    // Get initial state values from the State account
    const state = await client.program.account.state.fetch(client.env.state);
    initialBlazeMintedGsol = state.blazeMintedGsol as BN;
    initialMarinadeMintedGsol = state.marinadeMintedGsol as BN;

    const balance = await client.balance();
    initialBsolBalance = new BN(balance.bsolBalance?.amount ?? "0");
    initialLpBalance = new BN(balance.liqPoolBalance?.amount ?? "0");

    log("Initial blaze_minted_gsol:", initialBlazeMintedGsol.toString());
    log("Initial marinade_minted_gsol:", initialMarinadeMintedGsol.toString());
    log("Initial bSOL balance:", initialBsolBalance.toString());
    log("Initial LP balance:", initialLpBalance.toString());
  });

  it("can move SOL from SPL pool to Marinade liquidity pool", async () => {
    const lamports = new BN(1_000_000_000); // 1 SOL

    log("Moving", lamports.toString(), "lamports from SPL to Marinade LP...");

    // Execute the rebalance
    const transaction = await client.moveSplLiquidToMarinade(lamports);
    await client.sendAndConfirmTransaction(transaction, []);

    // Get updated state
    const postState = await client.program.account.state.fetch(client.env.state);
    const postBalance = await client.balance();

    const newBlazeMintedGsol = postState.blazeMintedGsol as BN;
    const newMarinadeMintedGsol = postState.marinadeMintedGsol as BN;
    const newBsolBalance = new BN(postBalance.bsolBalance?.amount ?? "0");
    const newLpBalance = new BN(postBalance.liqPoolBalance?.amount ?? "0");

    log("New blaze_minted_gsol:", newBlazeMintedGsol.toString());
    log("New marinade_minted_gsol:", newMarinadeMintedGsol.toString());
    log("New bSOL balance:", newBsolBalance.toString());
    log("New LP balance:", newLpBalance.toString());

    // Verify state accounting - blaze_minted_gsol should decrease
    const blazeDecrease = initialBlazeMintedGsol.sub(newBlazeMintedGsol);
    log("Blaze decrease:", blazeDecrease.toString());
    expectAmount(blazeDecrease, lamports, new BN(100_000)); // Allow small tolerance for fees

    // Verify state accounting - marinade_minted_gsol should increase
    const marinadeIncrease = newMarinadeMintedGsol.sub(initialMarinadeMintedGsol);
    log("Marinade increase:", marinadeIncrease.toString());
    expectAmount(marinadeIncrease, lamports, new BN(100_000)); // Allow small tolerance for fees

    // Verify bSOL balance decreased (we burned bSOL)
    chai.expect(newBsolBalance.lt(initialBsolBalance)).to.be.true;

    // Verify LP balance increased (we received LP tokens)
    chai.expect(newLpBalance.gt(initialLpBalance)).to.be.true;

    log("SPL to Marinade liquid transfer successful!");
  });
});
