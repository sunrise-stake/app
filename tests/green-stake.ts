import {utils} from "@project-serum/anchor";
import BN from "bn.js";
import {Keypair} from "@solana/web3.js";
import {expect} from "chai";
import {findMSolTokenAccountAuthority} from "../app/src/lib/client/util";
import {GreenStakeClient} from "../app/src/lib/client";

describe("green-stake", () => {
  let client: GreenStakeClient;

  const depositSOL = new BN(1000000);

  let msolTokenAmount: number;

  let stakerMsolTokenAccountAuthority

  const treasury = Keypair.generate();

  before('Initialise state', async () => {
    client = await GreenStakeClient.register(treasury)

    stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(client.config, client.staker)[0];
  });

  before('Initialise staker', () => client.createGSolTokenAccount());
  before('log stuff', () => client.details().then(console.log))

  it("can deposit sol", async () => {
    await client.deposit(depositSOL);
    const marinadeState = await client.marinadeState;
    const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress({ mint: marinadeState.mSolMintAddress, owner: stakerMsolTokenAccountAuthority })

    const msolBalance = await client.provider.connection.getTokenAccountBalance(msolAssociatedTokenAccountAddress)
    console.log("MSOL balance", msolBalance.value.uiAmount)

    const expectedMsol = Math.floor(depositSOL.toNumber() / marinadeState.mSolPrice);
    msolTokenAmount = Number(msolBalance.value.amount);

    expect(msolTokenAmount).to.equal(expectedMsol);

    const gsolBalance = await client.provider.connection.getTokenAccountBalance(client.stakerGSolTokenAccount)
    const gsolTokenAmount = Number(gsolBalance.value.amount);
    console.log("GSOL balance", gsolBalance.value.uiAmount)
    expect(gsolTokenAmount).to.equal(depositSOL.toNumber());
  });

  it("can withdraw sol", async () => {
    const stakerPreSolBalance = await client.provider.connection.getBalance(client.staker);
    console.log("Staker's sol balance before withdrawing: ", stakerPreSolBalance);

    await client.withdraw();

    const gsolBalance = await client.provider.connection.getTokenAccountBalance(client.stakerGSolTokenAccount)
    console.log("GSOL balance", gsolBalance.value.uiAmount)
    const gsolTokenAmount = Number(gsolBalance.value.amount);
    expect(gsolTokenAmount).to.equal(0);

    const stakerPostSolBalance = await client.provider.connection.getBalance(client.staker);
    console.log("Staker's sol balance after withdrawing: ", stakerPostSolBalance);

    // 0.3% fee for immediate withdrawal
    // Add 5k lamports for network fees
    const fee = new BN(depositSOL).muln(0.003).addn(5000);
    console.log("Expected fee for immediate withdrawal: ", fee.toNumber());
    expect(stakerPostSolBalance - stakerPreSolBalance).to.equal(new BN(depositSOL).sub(fee).toNumber());
  })
});