import {
  findEpochReportAccount,
  findLockAccount,
  findLockTokenAccount,
  type SunriseStakeConfig,
} from "./util";
import {
  type PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  type Transaction,
} from "@solana/web3.js";
import { type LockAccount } from "./types/LockAccount";
import { type Program } from "@project-serum/anchor";
import { type SunriseStake } from "./types/sunrise_stake";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import type BN from "bn.js";

export const getLockAccount = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey
): Promise<LockAccount | null> => {
  const [address] = findLockAccount(config, authority);

  const account = await program.account.lockAccount.fetchNullable(address);

  if (!account) return null;

  return {
    address,
    authority,
    lockTokenAccount: account.tokenAccount,
    startEpoch: account.startEpoch,
    stateAddress: account.stateAddress,
    sunriseYieldAtStart: account.sunriseYieldAtStart,
  };
};

interface LockGSolResult {
  lockAccount: PublicKey;
  lockGSolTokenAccount: PublicKey;
  transaction: Transaction;
}
export const lockGSol = async (
  config: SunriseStakeConfig,
  program: Program<SunriseStake>,
  authority: PublicKey,
  sourceGSolTokenAccount: PublicKey,
  lamports: BN
): Promise<LockGSolResult> => {
  const [lockAccount] = findLockAccount(config, authority);
  const [lockGSolTokenAccount] = findLockTokenAccount(config, authority);
  const [epochReportAccount] = findEpochReportAccount(config);

  type Accounts = Parameters<
    ReturnType<typeof program.methods.lockGsol>["accounts"]
  >[0];

  const accounts: Accounts = {
    state: config.stateAddress,
    gsolMint: config.gsolMint,
    authority,
    sourceGsolAccount: sourceGSolTokenAccount,
    lockGsolAccount: lockGSolTokenAccount,
    lockAccount,
    epochReportAccount,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: SYSVAR_CLOCK_PUBKEY,
  };

  const transaction = await program.methods
    .lockGsol(lamports)
    .accounts(accounts)
    .transaction();

  return {
    lockAccount,
    lockGSolTokenAccount,
    transaction,
  };
};
