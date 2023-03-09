import { Keypair, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import {
  SunriseStakeClient,
  Environment,
  IMPACT_NFT_PROGRAM_ID,
} from "../client/src";
import { burnGSol, log, waitForNextEpoch } from "./util";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { depositLamports, lockLamports } from "./constants";
import * as anchor from "@coral-xyz/anchor";
import { findImpactNFTMintAuthority } from "../client/src/util";
import { ImpactNftClient } from "@sunrisestake/impact-nft-client";
import BN from "bn.js";
import levels from "./impactNFTLevels.json";

chai.use(chaiAsPromised);

const LEVELS = 8;

export const burnLamports = 10 * LAMPORTS_PER_SOL;

const findImpactNftPda = (seed: Seed, authority: PublicKey) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(seed), authority.toBuffer()],
    IMPACT_NFT_PROGRAM_ID
  )[0];

enum Seed {
  GlobalState = "global_state",
}

describe.only("Impact NFTs", () => {
  let client: SunriseStakeClient;

  const treasury = Keypair.generate();
  const mint = Keypair.generate();

  let impactNftStateAddress: PublicKey;
  let impactNftMintAuthority: PublicKey;

  let impactNftClient: ImpactNftClient;

  before("register a new Sunrise state and mint gSOL", async () => {
    client = await SunriseStakeClient.register(
      treasury.publicKey,
      mint,
      Environment.devnet,
      {
        verbose: Boolean(process.env.VERBOSE),
      }
    );

    await client.sendAndConfirmTransaction(
      await client.deposit(depositLamports)
    );

    impactNftMintAuthority = findImpactNFTMintAuthority(client.config!)[0];
    impactNftStateAddress = findImpactNftPda(
      Seed.GlobalState,
      impactNftMintAuthority
    );

    log("Impact NFT state address: " + impactNftStateAddress.toBase58());
  });

  it("can register impact nft state", async () => {
    if (!client.config) throw new Error("Client not initialised");

    impactNftClient = await ImpactNftClient.register(
      impactNftMintAuthority,
      LEVELS
    );

    if (!impactNftClient.stateAddress)
      throw new Error("Impact NFT state not registered");

    // Create levels and collections: TODO
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

    // set the newly-generated impactNft state in the client config
    // so that it can be looked up in the next test
    client.config.impactNFTStateAddress = impactNftClient.stateAddress;
  });

  it("can mint an impact nft when locking gSOL", async () => {
    const transactions = await client.lockGSol(lockLamports);
    await client.sendAndConfirmTransactions(transactions);

    const details = await client.details();
    expect(details.impactNFTDetails?.tokenAccount).to.exist;
  });

  it("cannot re-lock", async () => {
    const shouldFail = client.sendAndConfirmTransactions(
      await client.lockGSol(lockLamports)
    );

    return expect(shouldFail).to.be.rejected;
  });

  it("cannot unlock sol this epoch", async () => {
    const shouldFail = client.sendAndConfirmTransactions(
      await client.unlockGSol()
    );

    return expect(shouldFail).to.be.rejected;
  });

  it("can update the lock account and the impact nft", async () => {
    // burn 10 gSOL so that there is some unclaimed yield for the crank operation to harvest
    // Note - we have to do this as we do not have the ability to increase the msol value
    await burnGSol(new BN(burnLamports), client);

    // Switch to the next epoch so that the lock account can be updated and the yield applied
    await waitForNextEpoch(client);

    await client.sendAndConfirmTransactions(await client.updateLockAccount());
  });
});
