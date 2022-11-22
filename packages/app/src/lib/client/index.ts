import { SunriseStake, IDL } from "./types/sunrise_stake";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Program, utils } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TokenAmount,
  Transaction,
} from "@solana/web3.js";
import {
  confirm,
  findGSolMintAuthority,
  findMSolTokenAccountAuthority,
  SunriseStakeConfig,
  logKeys,
} from "./util";
import {
  Marinade,
  MarinadeConfig,
  MarinadeState,
} from "@sunrisestake/marinade-ts-sdk";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";
import { Details } from "./types/Details";

const setUpAnchor = (): anchor.AnchorProvider => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  return provider;
};

export interface Balance {
  depositedSol: TokenAmount;
  msolBalance: TokenAmount;
  msolPrice: number;
}

const PROGRAM_ID = new PublicKey("gStMmPPFUGhmyQE8r895q28JVW9JkvDepNu2hTg1f4p");

export class SunriseStakeClient {
  readonly program: Program<SunriseStake>;
  config: SunriseStakeConfig | undefined;

  // TODO make private once all functions are moved in here
  marinade: Marinade | undefined;
  marinadeState: MarinadeState | undefined;

  // TODO move to config?
  readonly staker: PublicKey;
  stakerGSolTokenAccount: PublicKey | undefined;

  msolTokenAccountAuthority: PublicKey | undefined;
  msolTokenAccount: PublicKey | undefined;

  private constructor(
    readonly provider: AnchorProvider,
    readonly stateAddress: PublicKey
  ) {
    this.program = new Program<SunriseStake>(IDL, PROGRAM_ID, provider);
    this.staker = this.provider.publicKey;
  }

  private async init(): Promise<void> {
    const sunriseStakeState = await this.program.account.state.fetch(
      this.stateAddress
    );

    this.config = {
      gsolMint: sunriseStakeState.gsolMint,
      treasury: sunriseStakeState.treasury,
      programId: this.program.programId,
      stateAddress: this.stateAddress,
    };

    this.stakerGSolTokenAccount = PublicKey.findProgramAddressSync(
      [
        this.staker.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        sunriseStakeState.gsolMint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
    const [gsolMintAuthority] = findGSolMintAuthority(this.config);
    this.msolTokenAccountAuthority = findMSolTokenAccountAuthority(
      this.config
    )[0];

    const marinadeConfig = new MarinadeConfig({
      connection: this.provider.connection,
      publicKey: this.provider.publicKey,
      proxyStateAddress: this.stateAddress,
      proxySolMintAuthority: gsolMintAuthority,
      proxySolMintAddress: this.config.gsolMint,
      msolTokenAccountAuthority: this.msolTokenAccountAuthority,
      proxyTreasury: this.config.treasury,
    });
    this.marinade = new Marinade(marinadeConfig);
    this.marinadeState = await this.marinade.getMarinadeState();
    this.msolTokenAccount = await utils.token.associatedAddress({
      mint: this.marinadeState.mSolMintAddress,
      owner: this.msolTokenAccountAuthority,
    });
  }

  async createGSolTokenAccount(): Promise<string> {
    if (!this.stakerGSolTokenAccount || !this.config)
      throw new Error("init not called");

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
    return this.provider.sendAndConfirm(createATAIx, []);
  }

  public async deposit(lamports: BN): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.stakerGSolTokenAccount
    )
      throw new Error("init not called");

    // TODO chain these so the user does not have to sign up to three txes
    // Create the user's gsol token account if it does not exist
    const gsolTokenAccount = await this.provider.connection.getAccountInfo(
      this.stakerGSolTokenAccount
    );
    if (!gsolTokenAccount) {
      await this.createGSolTokenAccount();
    }

    console.log("Token account created. Depositing...");

    const { transaction } = await this.marinade.deposit(lamports);

    logKeys(transaction);
    return this.provider.sendAndConfirm(transaction, []);
  }

  public async unstake(lamports: BN): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount
    )
      throw new Error("init not called");

    const { transaction } = await this.marinade.liquidUnstake(
      lamports,
      this.msolTokenAccount
    );

    logKeys(transaction);

    return this.provider.sendAndConfirm(transaction, []);
  }

  public async withdrawToTreasury(): Promise<string> {
    if (
      !this.marinadeState ||
      !this.marinade ||
      !this.config ||
      !this.msolTokenAccount ||
      !this.msolTokenAccountAuthority
    )
      throw new Error("init not called");

    const marinadeProgram = this.marinade.marinadeFinanceProgram.programAddress;

    type Accounts = Parameters<
      ReturnType<typeof this.program.methods.withdrawToTreasury>["accounts"]
    >[0];

    const liqPoolSolLegPda = await this.marinadeState.solLeg();

    const accounts: Accounts = {
      state: this.stateAddress,
      marinadeState: this.marinadeState.marinadeStateAddress,
      msolMint: this.marinadeState.mSolMintAddress,
      gsolMint: this.config.gsolMint,
      liqPoolSolLegPda,
      liqPoolMsolLeg: this.marinadeState.mSolLeg,
      treasuryMsolAccount: this.marinadeState.treasuryMsolAccount,
      getMsolFrom: this.msolTokenAccount,
      getMsolFromAuthority: this.msolTokenAccountAuthority,
      treasury: this.config.treasury,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      marinadeProgram,
    };

    const transaction = await this.program.methods
      .withdrawToTreasury()
      .accounts(accounts)
      .transaction();

    return this.provider.sendAndConfirm(transaction, []);
  }

  public async details(): Promise<Details> {
    if (
      !this.marinadeState ||
      !this.stakerGSolTokenAccount ||
      !this.msolTokenAccount ||
      !this.config
    )
      throw new Error("init not called");

    const lpMintInfoPromise = this.marinadeState.lpMint.mintInfo();
    const lpbalancePromise = this.provider.connection.getTokenAccountBalance(
      this.marinadeState.mSolLeg
    );

    const msolBalancePromise = this.provider.connection.getTokenAccountBalance(
      this.msolTokenAccount
    );

    const [lpMintInfo, lpbalance, msolBalance] = await Promise.all([
      lpMintInfoPromise,
      lpbalancePromise,
      msolBalancePromise,
    ]);

    const lpDetails = {
      mintAddress: this.marinadeState.lpMint.address.toBase58(),
      supply: lpMintInfo.supply.toNumber(),
      mintAuthority: lpMintInfo.mintAuthority?.toBase58(),
      decimals: lpMintInfo.decimals,
      lpBalance: lpbalance.value.uiAmount,
    };

    return {
      staker: this.staker.toBase58(),
      stakerGSolTokenAccount: this.stakerGSolTokenAccount.toBase58(),
      sunriseStakeConfig: {
        gsolMint: this.config.gsolMint.toBase58(),
        programId: this.config.programId.toBase58(),
        stateAddress: this.config.stateAddress.toBase58(),
        treasury: this.config.treasury.toBase58(),
      },
      marinadeFinanceProgramId:
        this.marinadeState.marinadeFinanceProgramId.toBase58(),
      marinadeStateAddress: this.marinadeState.marinadeStateAddress.toBase58(),
      msolLeg: this.marinadeState.mSolLeg.toBase58(),
      msolPrice: this.marinadeState.mSolPrice,
      sunriseMsolBalance: msolBalance.value.uiAmount,
      stakeDelta: this.marinadeState.stakeDelta().toNumber(),
      lpDetails,
    };
  }

  public static async register(
    treasury: PublicKey
  ): Promise<SunriseStakeClient> {
    const sunriseStakeState = Keypair.generate();
    const gsolMint = Keypair.generate();
    const client = new SunriseStakeClient(
      setUpAnchor(),
      sunriseStakeState.publicKey
    );

    const config = {
      gsolMint: gsolMint.publicKey,
      programId: client.program.programId,
      stateAddress: sunriseStakeState.publicKey,
      treasury,
    };
    const marinadeConfig = new MarinadeConfig({
      connection: client.provider.connection,
    });
    const marinadeState = await new Marinade(marinadeConfig).getMarinadeState();

    const [, gsolMintAuthorityBump] = findGSolMintAuthority(config);

    const [msolAuthority, msolAuthorityBump] =
      findMSolTokenAccountAuthority(config);
    const msolAssociatedTokenAccountAddress =
      await utils.token.associatedAddress({
        mint: marinadeState.mSolMintAddress,
        owner: msolAuthority,
      });

    const accounts: Record<string, PublicKey> = {
      state: sunriseStakeState.publicKey,
      payer: client.provider.publicKey,
      mint: gsolMint.publicKey,
      msolMint: marinadeState.mSolMintAddress,
      msolTokenAccountAuthority: msolAuthority,
      msolTokenAccount: msolAssociatedTokenAccountAddress,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    };

    console.log(
      Object.keys(accounts).map((k) => `${k}: ${accounts[k].toBase58()}`)
    );

    await client.program.methods
      .registerState({
        // TODO replace with marinadeConfig.marinadeStateAddress when this is no longer a static function
        marinadeState: marinadeConfig.marinadeStateAddress,
        updateAuthority: client.provider.publicKey,
        gsolMint: gsolMint.publicKey,
        treasury,
        gsolMintAuthorityBump,
        msolAuthorityBump,
      })
      .accounts(accounts)
      .signers([gsolMint, sunriseStakeState])
      .rpc()
      .then(confirm(client.provider.connection));

    await client.init();

    return client;
  }

  public async getBalance(): Promise<Balance> {
    if (!this.marinadeState || !this.stakerGSolTokenAccount || !this.config)
      throw new Error("init not called");
    const depositedLamportsPromise = this.provider.connection
      .getTokenAccountBalance(this.stakerGSolTokenAccount)
      .catch((e) => {
        // Treat a missing account as zero balance
        if ((e.message as string).endsWith("could not find account")) {
          return {
            value: {
              amount: "0",
              decimals: 9,
              uiAmount: 0,
              uiAmountString: "0",
            },
          };
        }
        throw e;
      });

    const stakerMsolTokenAccountAuthority = findMSolTokenAccountAuthority(
      this.config
    )[0];
    const msolAssociatedTokenAccountAddress =
      await utils.token.associatedAddress({
        mint: this.marinadeState.mSolMintAddress,
        owner: stakerMsolTokenAccountAuthority,
      });
    const msolLamportsBalancePromise =
      this.provider.connection.getTokenAccountBalance(
        msolAssociatedTokenAccountAddress
      );

    const [depositedLamports, msolLamportsBalance] = await Promise.all([
      depositedLamportsPromise,
      msolLamportsBalancePromise,
    ]);

    return {
      depositedSol: depositedLamports.value,
      msolBalance: msolLamportsBalance.value,
      msolPrice: this.marinadeState.mSolPrice,
    };
  }

  public static async get(
    provider: AnchorProvider,
    stateAddress: PublicKey
  ): Promise<SunriseStakeClient> {
    const client = new SunriseStakeClient(provider, stateAddress);
    await client.init();
    return client;
  }
}
