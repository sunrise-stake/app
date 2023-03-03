import { Keypair, type PublicKey, SystemProgram } from "@solana/web3.js";
import {
  SunriseStakeClient,
  Environment,
  IMPACT_NFT_PROGRAM_ID,
} from "../client/src";
import { log } from "./util";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { depositLamports, lockLamports } from "./constants";
import * as anchor from "@coral-xyz/anchor";
import {findImpactNFTMintAuthority} from "../client/src/util";

chai.use(chaiAsPromised);

const findImpactNftPda = (seed: Seed, authority: PublicKey) =>
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(seed), authority.toBuffer()],
    IMPACT_NFT_PROGRAM_ID
  )[0];

enum Seed {
  GlobalState = "global_state",
}

describe.only("sunrise-stake Impact NFTs", () => {
  let client: SunriseStakeClient;

  const treasury = Keypair.generate();
  const mint = Keypair.generate();
  let impactNftStateAddress: PublicKey;

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

    impactNftStateAddress = findImpactNftPda(
      Seed.GlobalState,
        findImpactNFTMintAuthority(client.config!)[0]
    );

    log("Impact NFT state address: " + impactNftStateAddress.toBase58());
  });

  it("can initialise the impact nft state", async () => {
      if (!client.config) throw new Error("Client not initialised");

      const accounts = {
          state: client.env.state,
          payer: client.provider.publicKey,
          updateAuthority: client.provider.publicKey,
          impactNftMintAuthority: findImpactNFTMintAuthority(client.config)[0],
          impactNftState: impactNftStateAddress,
          impactNftProgram: IMPACT_NFT_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
      };

      log(accounts)

      await client.program.methods
      .initImpactNftState(8)
      .accounts(accounts)
      .rpc();
  });

  it("can mint an impact nft when locking gSOL", async () => {
      const [transaction, keypair] = await client.lockGSol(lockLamports);
      await client.sendAndConfirmTransaction(transaction, [keypair]);
  });
});
