import { Keypair, type PublicKey } from "@solana/web3.js";
import {
  SunriseStakeClient,
  Environment,
  IMPACT_NFT_PROGRAM_ID,
} from "../client/src";
import {impactNFTLevels, log} from "./util";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { depositLamports, lockLamports } from "./constants";
import * as anchor from "@coral-xyz/anchor";
import { findImpactNFTMintAuthority } from "../client/src/util";
import { ImpactNftClient } from "@sunrisestake/impact-nft-client";
import BN from "bn.js";

chai.use(chaiAsPromised);

const LEVELS = 8;

const findImpactNftPda = (seed: Seed, authority: PublicKey) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(seed), authority.toBuffer()],
    IMPACT_NFT_PROGRAM_ID
  )[0];

enum Seed {
  GlobalState = "global_state",
}

describe("Impact NFTs", () => {
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

    const levels = impactNFTLevels(LEVELS);

    await impactNftClient.registerOffsetTiers(levels);

    // set the newly-generated impactNft state in the client config
    // so that it can be looked up in the next test
    client.config.impactNFTStateAddress = impactNftClient.stateAddress;
  });

  it("can mint an impact nft when locking gSOL", async () => {
    const transaction = await client.lockGSol(lockLamports);
    await client.sendAndConfirmTransaction(transaction);
  });
});
