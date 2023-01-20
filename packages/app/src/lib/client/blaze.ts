import {
  PublicKey,
  StakeProgram,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  findBSolTokenAccountAuthority,
  findGSolMintAuthority
} from "./util";
import {
  SOLBLAZE_CONFIG
} from "../sunriseClientWrapper";
import { 
  STAKE_POOL_PROGRAM_ID,
  SOLBLAZE_DEPOSIT_AUTHORITY,
  SOLBLAZE_WITHDRAW_AUTHORITY,
} from "../constants";
import { AnchorProvider, Program, utils } from "@project-serum/anchor";
import { SunriseStake } from "./types/sunrise_stake";
import { SunriseStakeConfig, getVoterAddress } from "./util";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const findBlazeDepositAuthority = (): [PublicKey, number]=> {
  const seeds = [SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("deposit")];
  return PublicKey.findProgramAddressSync(seeds, STAKE_POOL_PROGRAM_ID);
}

const findBlazeWithdrawAuthority = (): [PublicKey, number]=> {
  const seeds = [SOLBLAZE_CONFIG.pool.toBuffer(), Buffer.from("withdraw")];
  return PublicKey.findProgramAddressSync(seeds, STAKE_POOL_PROGRAM_ID);
}

export const blazeDeposit = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  depositor: PublicKey,
  depositorGsolTokenAccount: PublicKey,
  lamports: BN,
): Promise<Transaction> => {
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = await utils.token.associatedAddress(
    {
      mint: SOLBLAZE_CONFIG.bsolMint,
      owner: bsolTokenAccountAuthority,
    }
  );

  type Accounts = Parameters<
    ReturnType<typeof program.methods.splDepositSol>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: config.stateAddress,
    gsolMint: config.gsolMint,
    gsolMintAuthority,
    depositor,
    depositorGsolTokenAccount,
    bsolTokenAccount: bsolAssociatedTokenAddress, 
    bsolAccountAuthority: bsolTokenAccountAuthority,
    stakePool: SOLBLAZE_CONFIG.pool,
    stakePoolWithdrawAuthority: SOLBLAZE_CONFIG.stakeAuthority,
    reserveStakeAccount: SOLBLAZE_CONFIG.reserveAccount,
    managerFeeAccount: SOLBLAZE_CONFIG.managerAccount,
    stakePoolTokenMint: SOLBLAZE_CONFIG.bsolMint,
    stakePoolProgram: STAKE_POOL_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  return program.methods
    .splDepositSol(lamports)
    .accounts(accounts)
    .transaction();
}

export const blazeDepositStake = async (
  config: SunriseStakeConfig,
  provider: AnchorProvider,
  program: Program<SunriseStake>,
  stakeAccount: PublicKey,
  depositorGsolTokenAccount: PublicKey,
): Promise<Transaction> => {
  const sunriseStakeState = await program.account.state.fetch(config.stateAddress);
  const [gsolMintAuthority] = findGSolMintAuthority(config);
  const bsolTokenAccountAuthority = findBSolTokenAccountAuthority(config)[0];
  const bsolAssociatedTokenAddress = await utils.token.associatedAddress(
    {
      mint: SOLBLAZE_CONFIG.bsolMint,
      owner: bsolTokenAccountAuthority,
    }
  );

  type Accounts = Parameters<
    ReturnType<typeof program.methods.splDepositStake>["accounts"]
  >[0];

  const validatorAccount = await getVoterAddress(stakeAccount, provider.connection);
  const accounts: Accounts = {
    state: config.stateAddress,
    gsolMint: config.gsolMint,
    gsolMintAuthority,
    stakeAccountDepositor: provider.publicKey,
    stakeAccount,
    depositorGsolTokenAccount,
    bsolTokenAccount: bsolAssociatedTokenAddress, 
    bsolAccountAuthority: bsolTokenAccountAuthority,
    stakePool: SOLBLAZE_CONFIG.pool,
    validatorList: SOLBLAZE_CONFIG.validatorList,
    stakePoolDepositAuthority: SOLBLAZE_DEPOSIT_AUTHORITY,
    stakePoolWithdrawAuthority: SOLBLAZE_WITHDRAW_AUTHORITY,
    validatorStakeAccount: validatorAccount,
    reserveStakeAccount: SOLBLAZE_CONFIG.reserveAccount,
    managerFeeAccount: SOLBLAZE_CONFIG.managerAccount,
    stakePoolTokenMint: SOLBLAZE_CONFIG.bsolMint,
    sysvarStakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
    sysvarClock: SYSVAR_CLOCK_PUBKEY,
    nativeStakeProgram: StakeProgram.programId,
    stakePoolProgram: STAKE_POOL_PROGRAM_ID,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  return program.methods
    .splDepositStake()
    .accounts(accounts)
    .transaction();
}