import { SunriseStakeClient } from "../client/src";
import "./util";
import {AnchorProvider, utils} from "@project-serum/anchor";
import {SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY} from "@solana/web3.js";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {
    findAllTickets,
    findMSolTokenAccountAuthority,
} from "../client/src/util";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";

(async () => {
  const provider = AnchorProvider.env();

  const client = await SunriseStakeClient.get(provider, process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork|| 'devnet');

  if (!client.config || !client.marinade || !client.marinadeState || !client.blazeState) throw new Error("init client first");

    const sunriseStakeState = await client.program.account.state.fetch(client.config.stateAddress);
    const marinadeProgram = client.marinade.marinadeFinanceProgram.programAddress;
    const msolTokenAccountAuthority = findMSolTokenAccountAuthority(client.config)[0];
    const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress(
        {
            mint: client.marinadeState.mSolMintAddress,
            owner: msolTokenAccountAuthority,
        }
    );
    const liqPoolAssociatedTokenAccountAddress =
        await utils.token.associatedAddress({
            mint: client.marinadeState.lpMint.address,
            owner: msolTokenAccountAuthority,
        });

    type Accounts = Parameters<
        ReturnType<typeof client.program.methods.recoverMissedEpoch>["accounts"]
    >[0];

    const accounts: Accounts = {
        state: client.config!.stateAddress,
        payer: provider.publicKey,
        marinadeState: client.marinadeState.marinadeStateAddress,
        blazeState: client.blazeState.pool,
        gsolMint: sunriseStakeState.gsolMint,
        msolMint: client.marinadeState.mSolMint.address,
        bsolMint: client.blazeState.bsolMint,
        liqPoolMint:client.marinadeState.lpMint.address,
        liqPoolSolLegPda: await client.marinadeState.solLeg(),
        liqPoolMsolLeg: client.marinadeState.mSolLeg,
        liqPoolMsolLegAuthority: await client.marinadeState.mSolLegAuthority(),
        liqPoolMintAuthority: await client.marinadeState.lpMintAuthority(),
        liqPoolTokenAccount: liqPoolAssociatedTokenAccountAddress,
        reservePda: await client.marinadeState.reserveAddress(),
        treasuryMsolAccount: client.marinadeState.treasuryMsolAccount,
        getMsolFrom: msolAssociatedTokenAccountAddress,
        getMsolFromAuthority: msolTokenAccountAuthority,
        getBsolFrom: client.bsolTokenAccount,
        getBsolFromAuthority: client.bsolTokenAccountAuthority,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
        rent: SYSVAR_RENT_PUBKEY,
        marinadeProgram,
    };

    const previousEpochTickets = await findAllTickets(
        client.program.provider.connection,
        client.config,
        // change BigInt(1) to 1n when we target ES2020 in tsconfig.json
        BigInt(process.argv[2]),
        3
    );

    const previousEpochTicketAccountMetas = previousEpochTickets.map(
        (ticket) => ({
            pubkey: ticket,
            isSigner: false,
            isWritable: true,
        })
    );

    console.log("found ", previousEpochTicketAccountMetas.length, " tickets for epoch ", process.argv[2]);

    if (previousEpochTicketAccountMetas.length > 0) {
        const txSig = await client.program.methods
            .recoverMissedEpoch()
            .accounts(accounts)
            .remainingAccounts(previousEpochTicketAccountMetas)
            .rpc();

        console.log("txSig", txSig)
    }
})().catch(console.error);
