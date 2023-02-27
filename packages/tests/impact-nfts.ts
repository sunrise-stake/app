import BN from "bn.js";
import {Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram} from "@solana/web3.js";
import {
  SunriseStakeClient,
  type TicketAccount,
  DEFAULT_LP_MIN_PROPORTION,
  DEFAULT_LP_PROPORTION,
  NETWORK_FEE,
  Environment, IMPACT_NFT_PROGRAM_ID, SunriseStake, IDL,
} from "../client/src";
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
} from "./util";
import chai from "chai";
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
} from "./constants";
import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {PROGRAM_ID} from "@sunrisestake/client/dist/util";

chai.use(chaiAsPromised);

const { expect } = chai;

const findImpactNftPda = (seed: Seed, authority: PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(seed),
          authority.toBuffer(),
        ],
        IMPACT_NFT_PROGRAM_ID
    )[0];

enum Seed {
  GlobalState = "global_state"
}

describe.only("sunrise-stake Impact NFTs", () => {
  let client: SunriseStakeClient;

  let treasury = Keypair.generate();
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

    impactNftStateAddress = findImpactNftPda(Seed.GlobalState, client.provider.publicKey);

    log("Impact NFT state address: " + impactNftStateAddress.toBase58());
  });

  it("can initialise the impact nft state", async () => {
    await client.program.methods.initImpactNftState(8).accounts({
      state: client.env.state,
      payer: client.provider.publicKey,
      updateAuthority: client.provider.publicKey,
      impactNftState: impactNftStateAddress,
      impactNftProgram: IMPACT_NFT_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).rpc();
  });

  it('can mint an impact nft when locking gSOL', async () => {
    await client.sendAndConfirmTransaction(await client.lockGSol(lockLamports));
  });
});
