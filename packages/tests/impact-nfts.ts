import { Keypair, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import { SunriseStakeClient, Environment } from "../client/src/index.js";
import { burnGSol, waitForNextEpoch } from "./util.js";
import { expect } from "chai";
import * as chai from 'chai';
import chaiAsPromised from "chai-as-promised";
import { depositLamports, lockLamports } from "./constants.js";
import { findImpactNFTMintAuthority } from "../client/src/util.js";
import { ImpactNftClient } from "@sunrisestake/impact-nft-client";
import BN from "bn.js";
import levels from "./impactNFTLevels.json";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

chai.use(chaiAsPromised);

const LEVELS = 8;

export const burnLamports = 10 * LAMPORTS_PER_SOL;

describe("Impact NFTs", () => {
  let client: SunriseStakeClient;

  const treasury = Keypair.generate();
  const mint = Keypair.generate();

  let impactNftMintAuthority: PublicKey;

  let impactNftClient: ImpactNftClient;

  let expectedYield: number;

  before("register a new Sunrise state and impact nft state", async () => {
    // we need to register the sunrise state before we register impact nft state,
    // so that we can derive the impact nft mint authority PDA from the sunrise state
    // so this is just a temporary client to register the sunrise state
    const environmentWithoutImpactNft = {
      ...Environment.devnet,
      impactNFT: {
        state: undefined,
      },
    };
    const initialClient = await SunriseStakeClient.register(
      treasury.publicKey,
      mint,
      environmentWithoutImpactNft,
      {
        verbose: Boolean(process.env.VERBOSE),
      }
    );

    await initialClient.sendAndConfirmTransaction(
      await initialClient.deposit(depositLamports)
    );

    impactNftMintAuthority = findImpactNFTMintAuthority(
      initialClient.config!
    )[0];
    impactNftClient = await ImpactNftClient.register(
      impactNftMintAuthority,
      LEVELS
    );

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

    // now that we have the impact nft state address, we can create the real client
    client = await SunriseStakeClient.get(
      initialClient.provider,
      WalletAdapterNetwork.Devnet,
      {
        environmentOverrides: {
          state: initialClient.config!.stateAddress,
          impactNFT: {
            state: impactNftClient.stateAddress!,
          },
        },
      }
    );
  });

  it("can mint an impact nft when locking gSOL", async () => {
    const transactions = await client.lockGSol(lockLamports);
    await client.sendAndConfirmTransactions(
      transactions,
      undefined,
      undefined,
      true
    );

    const details = await client.details();
    expect(details.impactNFTDetails?.tokenAccount).to.exist;
    expect(details.lockDetails?.amountLocked.toNumber()).to.eq(
      lockLamports.toNumber()
    );
    expect(details.lockDetails?.yield.toNumber()).to.eq(0);
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

    const currentEpoch = await client.provider.connection.getEpochInfo();
    const details = await client.details();

    expectedYield = details.lockDetails!.yield.toNumber();
    expect(details.lockDetails?.updatedToEpoch.toNumber()).to.equal(
      currentEpoch.epoch
    );
    // the exact number varies depending on other tests
    expect(expectedYield).to.be.greaterThan(110000000);
  });

  it("updating again has no effect", async () => {
    await client.sendAndConfirmTransactions(await client.updateLockAccount());

    const currentEpoch = await client.provider.connection.getEpochInfo();
    const details = await client.details();

    expect(details.lockDetails?.updatedToEpoch.toNumber()).to.equal(
      currentEpoch.epoch
    );
    expect(details.lockDetails?.yield?.toNumber()).to.equal(expectedYield);
  });

  it("can add gSOL to existing locked account", async () => {
    const transactions = await client.addLockedGSol(lockLamports);
    await client.sendAndConfirmTransactions(
      transactions,
      undefined,
      undefined,
      true
    );

    const details = await client.details();
    expect(details.lockDetails?.amountLocked.toNumber()).to.eq(
      lockLamports.add(lockLamports).toNumber()
    );
    expect(details.impactNFTDetails?.tokenAccount).to.exist;
  });

  it("registers add gSOL correctly", async () => {
    await burnGSol(new BN(burnLamports), client);

    // Switch to the next epoch so that the lock account can be updated and the yield applied
    await waitForNextEpoch(client);

    await client.sendAndConfirmTransactions(await client.updateLockAccount());

    const currentEpoch = await client.provider.connection.getEpochInfo();
    const details = await client.details();

    expectedYield = details.lockDetails!.yield.toNumber();
    expect(details.lockDetails?.updatedToEpoch.toNumber()).to.equal(
      currentEpoch.epoch
    );
    // the exact number varies depending on other tests
    // expected yield = 1 * 0.11 SOL + 2 * 0.125 SOL
    expect(expectedYield).to.be.greaterThan(360000000);
  });

  it("cannot add gSOL to existing locked account if epoch is not updated", async () => {
    await waitForNextEpoch(client);
    const transactions = await client.addLockedGSol(lockLamports);
    const shouldFail = client.sendAndConfirmTransactions(
      transactions,
      undefined,
      undefined,
      true
    );

    return expect(shouldFail).to.be.rejected;
  });

  it("updating again after the next epoch has no effect if no more yield is added", async () => {
    await waitForNextEpoch(client);

    await client.sendAndConfirmTransactions(await client.updateLockAccount());

    const currentEpoch = await client.provider.connection.getEpochInfo();
    const details = await client.details();

    expect(details.lockDetails?.updatedToEpoch.toNumber()).to.equal(
      currentEpoch.epoch
    );
    expect(details.lockDetails?.yield?.toNumber()).to.equal(expectedYield);
  });
});
