import {SunriseStake, IDL} from "./types/sunrise_stake";
import * as anchor from "@project-serum/anchor";
import {AnchorProvider, Program, utils} from "@project-serum/anchor";
import {Keypair, PublicKey, SystemProgram, TokenAmount, Transaction} from "@solana/web3.js";
import {confirm, findGSolMintAuthority, findMSolTokenAccountAuthority, SunriseStakeConfig, logKeys} from "./util";
import {Marinade, MarinadeConfig, MarinadeState} from "@marinade.finance/marinade-ts-sdk";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import BN from "bn.js";

const setUpAnchor = () => {
    // Configure the client to use the local cluster.
    const provider = AnchorProvider.env();
    anchor.setProvider(provider);

    return provider
}

export type Balance = {
    depositedSol: TokenAmount,
    msolBalance: TokenAmount,
    msolPrice: number
}

const PROGRAM_ID = new PublicKey("gStMmPPFUGhmyQE8r895q28JVW9JkvDepNu2hTg1f4p")

export class SunriseStakeClient {
    readonly program: Program<SunriseStake>;
    config: SunriseStakeConfig | undefined;

    // TODO make private once all functions are moved in here
    marinade: Marinade | undefined;
    marinadeState: MarinadeState | undefined;

    // TODO move to config?
    readonly staker: PublicKey;
    stakerGSolTokenAccount: PublicKey | undefined;

    private constructor(readonly provider: AnchorProvider, readonly stateAddress: PublicKey) {
        this.program = new Program<SunriseStake>(
            IDL,
            PROGRAM_ID,
            provider
        );
        this.staker = this.provider.publicKey;
    }

    private async init() {
        const sunriseStakeState = await this.program.account.state.fetch(this.stateAddress);

        this.config = {
            gsolMint: sunriseStakeState.gsolMint,
            treasury: sunriseStakeState.treasury,
            programId: this.program.programId,
            stateAddress: this.stateAddress
        }

        this.stakerGSolTokenAccount = PublicKey.findProgramAddressSync([this.staker.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), sunriseStakeState.gsolMint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)[0];
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
        if (!this.stakerGSolTokenAccount || !this.config) throw new Error("init not called");

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

    private async createMSolTokenAccount(
        stakerMsolTokenAccountAuthority: PublicKey,
        msolAssociatedTokenAccountAddress: PublicKey
    ): Promise<string> {
        if (!this.marinadeState || !this.marinade || !this.config) throw new Error("init not called");
        const createMsolTokenAccountTransactionAccounts = {
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
        const createAccountsTransaction = await this.program.methods.createMsolTokenAccount().accounts(createMsolTokenAccountTransactionAccounts).transaction();
        return this.provider.sendAndConfirm(createAccountsTransaction, []);
    }
    
    public async deposit(amount: BN): Promise<string> {
        if (!this.marinadeState || !this.marinade || !this.config || !this.stakerGSolTokenAccount) throw new Error("init not called");

        // TODO chain these so the user does not have to sign up to three txes
        // Create the user's gsol token account if it does not exist
        const gsolTokenAccount = await this.provider.connection.getAccountInfo(this.stakerGSolTokenAccount);
        if (!gsolTokenAccount) {
            await this.createGSolTokenAccount();
        }

        // Create the user's msol token account if it does not exist
        const stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(this.config, this.staker)[0];
        const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress({ mint: this.marinadeState.mSolMintAddress, owner: stakerMsolTokenAccountAuthority })
        const msolTokenAccount = await this.provider.connection.getAccountInfo(msolAssociatedTokenAccountAddress);
        if (!msolTokenAccount) {
            await this.createMSolTokenAccount(stakerMsolTokenAccountAuthority, msolAssociatedTokenAccountAddress);
        }

        console.log("Token account created. Depositing...")

        const { transaction } = await this.marinade.deposit(amount);

        logKeys(transaction);
        return this.provider.sendAndConfirm(transaction, []);
    }

    public async withdraw(): Promise<string> {
        if (!this.marinadeState || !this.marinade || !this.config) throw new Error("init not called");

        const stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(this.config, this.staker)[0];
        const msolAssociatedTokenAccountAddress = await utils.token.associatedAddress({ mint: this.marinadeState.mSolMintAddress, owner: stakerMsolTokenAccountAuthority })
        const msolBalance = await this.provider.connection.getTokenAccountBalance(msolAssociatedTokenAccountAddress);

        const { transaction } = await this.marinade.liquidUnstake(new BN(msolBalance.value.amount), msolAssociatedTokenAccountAddress);

        logKeys(transaction);

        return this.provider.sendAndConfirm(transaction, []);
    }

    public async details() {
        if (!this.marinadeState || !this.stakerGSolTokenAccount || !this.config) throw new Error("init not called");

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
            sunriseStakeConfig: {
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

    public static async register(treasury: PublicKey): Promise<SunriseStakeClient> {
        const sunriseStakeState = Keypair.generate();
        const gsolMint = Keypair.generate();
        const client = new SunriseStakeClient(setUpAnchor(), sunriseStakeState.publicKey);

        const [, gsolMintAuthorityBump] = findGSolMintAuthority({
            gsolMint: gsolMint.publicKey,
            programId: client.program.programId,
            stateAddress: sunriseStakeState.publicKey,
            treasury
        });
        await client.program.methods.registerState({
            // TODO replace with marinadeConfig.marinadeStateAddress when this is no longer a static function
            marinadeState: new MarinadeConfig().marinadeStateAddress,
            updateAuthority: client.provider.publicKey,
            gsolMint: gsolMint.publicKey,
            treasury,
            gsolMintAuthorityBump
        }).accounts({
            state: sunriseStakeState.publicKey,
            payer: client.provider.publicKey,
            mint: gsolMint.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).signers([gsolMint, sunriseStakeState])
            .rpc()
            .then(confirm(client.provider.connection));

        await client.init();

        return client;
    }

    public async getBalance(): Promise<Balance> {
        if (!this.marinadeState || !this.stakerGSolTokenAccount || !this.config) throw new Error("init not called");
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

    public static async get(provider: AnchorProvider, stateAddress: PublicKey): Promise<SunriseStakeClient> {
        const client = new SunriseStakeClient(provider, stateAddress);
        await client.init();
        return client;
    }
}