import {GreenStake} from "../../target/types/green_stake";
import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program, utils} from "@project-serum/anchor";
import {Keypair, PublicKey, SystemProgram, TokenAmount, Transaction} from "@solana/web3.js";
import {confirm, findGSolMintAuthority, findMSolTokenAccountAuthority, GreenStakeConfig, logKeys} from "../util";
import {Marinade, MarinadeConfig, MarinadeState} from "@marinade.finance/marinade-ts-sdk";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import BN from "bn.js";

const setUpAnchor = () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    return provider
}

export type Balance = {
    depositedSol: TokenAmount,
    msolBalance: TokenAmount,
    msolPrice: number
}

export class GreenStakeClient {
    readonly program: Program<GreenStake>;
    config: GreenStakeConfig;

    // TODO make private once all functions are moved in here
    marinade: Marinade;
    marinadeState: MarinadeState;

    // TODO move to config?
    readonly staker: PublicKey;
    stakerGSolTokenAccount: PublicKey;

    private constructor(readonly provider: AnchorProvider, readonly stateAddress: PublicKey) {
        this.program = anchor.workspace.GreenStake as Program<GreenStake>;
        this.staker = this.provider.publicKey;
    }

    private async init() {
        const greenStakeState = await this.program.account.state.fetch(this.stateAddress);

        this.config = {
            gsolMint: greenStakeState.gsolMint,
            treasury: greenStakeState.treasury,
            programId: this.program.programId,
            stateAddress: this.stateAddress
        }

        this.stakerGSolTokenAccount = PublicKey.findProgramAddressSync([this.staker.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), greenStakeState.gsolMint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)[0];
        const stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(this.config, this.staker)[0];
        const [gsolMintAuthority] = findGSolMintAuthority(this.config);

        const marinadeConfig = new MarinadeConfig({
            connection: this.provider.connection,
            publicKey: this.provider.publicKey,
            proxyStateAddress: this.stateAddress,
            proxySolMintAuthority: gsolMintAuthority,
            proxySolMintAddress: this.config.gsolMint,
            msolTokenAccountAuthority: stakerMsolTokenAccountAuthority,
            proxyTreasury: this.config.treasury,
        })
        this.marinade = new Marinade(marinadeConfig);
        this.marinadeState = await this.marinade.getMarinadeState();
    }

    async createGSolTokenAccount(): Promise<string> {
        // give the staker a gSOL account
        const createATAInstruction = Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            this.config.gsolMint,
            this.stakerGSolTokenAccount,
            this.staker,
            this.provider.publicKey
        );
        const createATAIx = new Transaction().add(createATAInstruction);
        return await this.provider.sendAndConfirm(createATAIx, []);
    }
    
    public async deposit(amount: BN): Promise<string> {
        const stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(this.config, this.staker)[0];
        const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress({ mint: this.marinadeState.mSolMintAddress, owner: stakerMsolTokenAccountAuthority })

        const accounts = {
            state: this.config.stateAddress,
            payer: this.provider.publicKey,
            authority: this.staker,
            msolTokenAccountAuthority: stakerMsolTokenAccountAuthority,
            msolMint: this.marinadeState.mSolMintAddress,
            msolTokenAccount: msolAssociatedTokenAccountAddress,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        };

        console.log("Create msol token account")
        const createAccountsTransaction = await this.program.methods.createMsolTokenAccount().accounts(accounts).transaction();
        await this.provider.sendAndConfirm(createAccountsTransaction, []);

        console.log("Token account created. Depositing...")

        const { transaction } = await this.marinade.deposit(amount);

        logKeys(transaction);
        return this.provider.sendAndConfirm(transaction, []);
    }

    public async withdraw(): Promise<string> {
        const stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(this.config, this.staker)[0];
        const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress({ mint: this.marinadeState.mSolMintAddress, owner: stakerMsolTokenAccountAuthority })
        const msolBalance = await this.provider.connection.getTokenAccountBalance(msolAssociatedTokenAccountAddress);

        const { transaction } = await this.marinade.liquidUnstake(new BN(msolBalance.value.amount), msolAssociatedTokenAccountAddress);

        logKeys(transaction);

        return this.provider.sendAndConfirm(transaction, []);
    }

    public async details() {
        const lpMintInfo = await this.marinadeState.lpMint.mintInfo();
        const lpbalance = await this.provider.connection.getTokenAccountBalance(this.marinadeState.mSolLeg);

        const lpDetails = {
            mintAddress: this.marinadeState.lpMint.address.toBase58(),
            supply: lpMintInfo.supply.toNumber(),
            mintAuthority: lpMintInfo.mintAuthority?.toBase58(),
            decimals: lpMintInfo.decimals,
            lpbalance: lpbalance.value.uiAmount
        }

        return {
            staker: this.staker.toBase58(),
            stakerGSolTokenAccount: this.stakerGSolTokenAccount.toBase58(),
            greenStakeConfig: {
                gsolMint: this.config.gsolMint.toBase58(),
                programId: this.config.programId.toBase58(),
                stateAddress: this.config.stateAddress.toBase58(),
                treasury: this.config.treasury.toBase58(),
            },
            marinadeFinanceProgramId: this.marinadeState.marinadeFinanceProgramId.toBase58(),
            marinadeStateAddress: this.marinadeState.marinadeStateAddress.toBase58(),
            msolLeg: this.marinadeState.mSolLeg.toBase58(),
            msolPrice: this.marinadeState.mSolPrice,
            stakeDelta: this.marinadeState.stakeDelta().toNumber(),
            lpDetails,
        }
    }

    public static async register(treasury: Keypair): Promise<GreenStakeClient> {
        const greenStakeState = Keypair.generate();
        const gsolMint = Keypair.generate();
        const client = new GreenStakeClient(setUpAnchor(), greenStakeState.publicKey);

        const [, gsolMintAuthorityBump] = findGSolMintAuthority({
            gsolMint: gsolMint.publicKey,
            programId: client.program.programId,
            stateAddress: greenStakeState.publicKey,
            treasury: treasury.publicKey
        });
        await client.program.methods.registerState({
            // TODO replace with marinadeConfig.marinadeStateAddress when this is no longer a static function
            marinadeState: new MarinadeConfig().marinadeStateAddress,
            updateAuthority: client.provider.publicKey,
            gsolMint: gsolMint.publicKey,
            treasury: treasury.publicKey,
            gsolMintAuthorityBump
        }).accounts({
            state: greenStakeState.publicKey,
            payer: client.provider.publicKey,
            mint: gsolMint.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).signers([gsolMint, greenStakeState])
            .rpc()
            .then(confirm(client.provider.connection));

        await client.init();

        return client;
    }

    public async getBalance(): Promise<Balance> {
        const depositedLamportsPromise = this.provider.connection.getTokenAccountBalance(this.stakerGSolTokenAccount);

        const stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(this.config, this.staker)[0];
        const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress({ mint: this.marinadeState.mSolMintAddress, owner: stakerMsolTokenAccountAuthority })
        const msolLamportsBalancePromise = this.provider.connection.getTokenAccountBalance(msolAssociatedTokenAccountAddress);

        const [depositedLamports, msolLamportsBalance] = await Promise.all([depositedLamportsPromise, msolLamportsBalancePromise]);

        return {
            depositedSol: depositedLamports.value,
            msolBalance: msolLamportsBalance.value,
            msolPrice: this.marinadeState.mSolPrice
        }
    }

    public static async get(provider: AnchorProvider, stateAddress: PublicKey): Promise<GreenStakeClient> {
        const client = new GreenStakeClient(provider, stateAddress);
        await client.init();
        return client;
    }
}