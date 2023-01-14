import {ComputeBudgetProgram, Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY} from "@solana/web3.js";
import {
    findGSolMintAuthority,
    findMSolTokenAccountAuthority, findOrderUnstakeTicketAccount,
    findOrderUnstakeTicketManagementAccount,
    SunriseStakeConfig
} from "./util";
import {Marinade, MarinadeState} from "@sunrisestake/marinade-ts-sdk";
import {Program, utils} from "@project-serum/anchor";
import {SunriseStake} from "./types/sunrise_stake";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import BN from "bn.js";

const getOrderUnstakeTicketManagementAccount = async (
    config: SunriseStakeConfig,
    program: Program<SunriseStake>
): Promise<{ address: PublicKey, bump: number, account: { tickets: BN } | null}> => {
    const epochInfo = await program.provider.connection.getEpochInfo();
    const [address, bump] = findOrderUnstakeTicketManagementAccount(config, BigInt(epochInfo.epoch));
    const account = await program.account.orderUnstakeTicketManagementAccount.fetchNullable(address);

    return {
        address,
        bump,
        account
    }
}

// TODO move this into the client to avoid having to pass in so many things?
export const liquidUnstake = async (
    config: SunriseStakeConfig,
    marinade: Marinade,
    marinadeState: MarinadeState,
    program: Program<SunriseStake>,
    stateAddress: PublicKey,
    staker: PublicKey,
    stakerGsolTokenAccount: PublicKey,
    lamports: BN,
) => {
    const sunriseStakeState = await program.account.state.fetch(
        stateAddress
    );
    const marinadeProgram = marinade.marinadeFinanceProgram.programAddress;
    const [gsolMintAuthority] = findGSolMintAuthority(config);
    const msolTokenAccountAuthority = findMSolTokenAccountAuthority(
        config
    )[0];
    const msolAssociatedTokenAccountAddress =
        await utils.token.associatedAddress({
            mint: marinadeState.mSolMintAddress,
            owner: msolTokenAccountAuthority,
        });
    // use the same token authority PDA for the msol token account
    // and the liquidity pool token account for convenience
    const liqPoolAssociatedTokenAccountAddress =
        await utils.token.associatedAddress({
            mint: marinadeState.lpMint.address,
            owner: msolTokenAccountAuthority,
        });

    const epochInfo = await program.provider.connection.getEpochInfo();
    const managementAccount = await getOrderUnstakeTicketManagementAccount(config, program);
    // TODO incrementing on the client side like this will cause clashes in future, we need to replace it
    const index = (managementAccount?.account?.tickets.toNumber() || 0) + 1;
    const [orderUnstakeTicketAccount, orderUnstakeTicketAccountBump] = findOrderUnstakeTicketAccount(config, BigInt(epochInfo.epoch), BigInt(index));

    // TODO temp
    // const orderUnstakeTicketAccountKeypair = Keypair.generate();

    type Accounts = Parameters<
        ReturnType<typeof program.methods.liquidUnstake>["accounts"]
    >[0];

    const accounts: Accounts = {
        state: stateAddress,
        marinadeState: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.mSolMint.address,
        liqPoolMint: marinadeState.lpMint.address,
        gsolMint: sunriseStakeState.gsolMint,
        gsolMintAuthority,
        gsolTokenAccount: stakerGsolTokenAccount,
        gsolTokenAccountAuthority: staker,
        liqPoolSolLegPda: await marinadeState.solLeg(),
        liqPoolMsolLeg: marinadeState.mSolLeg,
        liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
        treasuryMsolAccount: marinadeState.treasuryMsolAccount,
        getMsolFrom: msolAssociatedTokenAccountAddress,
        getMsolFromAuthority: msolTokenAccountAuthority,
        getLiqPoolTokenFrom: liqPoolAssociatedTokenAccountAddress,
        orderUnstakeTicketAccount,
        orderUnstakeTicketManagementAccount: managementAccount.address,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
        rent: SYSVAR_RENT_PUBKEY,
        marinadeProgram,
    };

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
    });

    const transaction = await program.methods
        .liquidUnstake(
            lamports,
            new BN(epochInfo.epoch),
                new BN(index),
            orderUnstakeTicketAccountBump,
        )
        .accounts(accounts)
        // .signers([orderUnstakeTicketAccountKeypair])
        .preInstructions([modifyComputeUnits])
        .transaction()

    return {
        transaction,
        orderUnstakeTicketAccount,
        // orderUnstakeTicketAccountKeypair // TODO TEMP
    }
}