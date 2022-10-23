import * as anchor from "@project-serum/anchor";
import {Program, utils} from "@project-serum/anchor";
import { GreenStake } from "../target/types/green_stake";
import BN from "bn.js";
import {Marinade, MarinadeConfig, MarinadeState} from "@marinade.finance/marinade-ts-sdk";
import {PublicKey} from "@solana/web3.js";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {getAssociatedTokenAccountAddress, SYSTEM_PROGRAM_ID} from "@marinade.finance/marinade-ts-sdk/dist/src/util";
import {expect} from "chai";

describe("green-stake", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GreenStake as Program<GreenStake>;

  const deriveTokenAccountAddress = (
      authority: PublicKey,
  ): [PublicKey, number] => {
    const seeds = [
      anchor.utils.bytes.utf8.encode("msol_account"),
      authority.toBuffer(),
    ];
    return PublicKey.findProgramAddressSync(
        seeds,
        program.programId
    );
  };

  let marinade: Marinade;

  const depositAmount = new BN(1000000);
  const msolTokenAccountAuthority = deriveTokenAccountAddress(provider.publicKey)[0];
  let state: MarinadeState;

  before(async () => {
    const config = new MarinadeConfig({
      connection: provider.connection,
      publicKey: provider.publicKey,
      marinadeFinanceProgramId: new PublicKey("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD")//program.programId
    })
    marinade = new Marinade(config);

    state = await marinade.getMarinadeState();

    state.solLeg().then(l => console.log('sol leg', l.toBase58()));

    console.log({
        marinadeFinanceProgramId: state.marinadeFinanceProgramId.toBase58(),
        marinadeStateAddress: state.marinadeStateAddress.toBase58(),
        msolLeg: state.mSolLeg.toBase58(),
      liqPoolSolLeg: state.solLeg()
    })
  })

  it("can deposit sol", async () => {
    const associatedTokenAccountAddress = await utils.token.associatedAddress({ mint: state.mSolMintAddress, owner: msolTokenAccountAuthority })

    const accounts = {
      payer: provider.publicKey,
      authority: provider.publicKey,
      msolTokenAccountAuthority,
      msolMint: state.mSolMintAddress,
      msolTokenAccount: associatedTokenAccountAddress,
      systemProgram: SYSTEM_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    };
    Object.keys(accounts).map((key) => {
      console.log(key, accounts[key].toBase58());
    });
    const createAccountsTransaction = await program.methods.createTokenAccount().accounts(accounts).transaction();
    await provider.sendAndConfirm(createAccountsTransaction);

    console.log("Token account created. Depositing...")

    const { transaction } = await marinade.deposit(depositAmount, {
      mintToOwnerAddress: msolTokenAccountAuthority
    });
    await provider.sendAndConfirm(transaction);

    const msolTreasuryBalance = await provider.connection.getTokenAccountBalance(new PublicKey("8ZUcztoAEhpAeC2ixWewJKQJsSUGYSGPVAjkhDJYf5Gd"))
    console.log("MSOL treasury balance", msolTreasuryBalance.value.uiAmount)

    const msolBalance = await provider.connection.getTokenAccountBalance(associatedTokenAccountAddress)
    console.log("MSOL balance", msolBalance.value.uiAmount)

    expect(Number(msolBalance.value.amount)).to.equal(depositAmount.toNumber());
  });

  it("can withdraw sol", async () => {
    const msolTreasuryBalance = await provider.connection.getTokenAccountBalance(new PublicKey("8ZUcztoAEhpAeC2ixWewJKQJsSUGYSGPVAjkhDJYf5Gd"))
    console.log("MSOL treasury balance", msolTreasuryBalance.value.uiAmount)

    const associatedTokenAccountAddress = await utils.token.associatedAddress({ mint: state.mSolMintAddress, owner: msolTokenAccountAuthority })
    const { transaction } = await marinade.liquidUnstake(depositAmount, associatedTokenAccountAddress);
    transaction.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = provider.publicKey;

    transaction.instructions.forEach((instruction, j) => {
      instruction.keys.forEach((key, i) => {
        console.log(j, i, key.pubkey.toBase58());
      })
    })

    let t = await provider.wallet.signTransaction(transaction);
    console.log(t.serialize().toString("base64"));
    // console.log(transaction.serializeMessage().toString("base64"));
    await provider.sendAndConfirm(transaction);
  })
});