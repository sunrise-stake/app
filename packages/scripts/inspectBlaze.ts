import "./util.js";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getStakePoolAccount,
  StakePoolLayout,
  type StakePool,
} from "../client/src/decodeStakePool.js";
import { Environment } from "../client/src/constants.js";
import { struct, u8, u32, u64, publicKey } from "@project-serum/borsh";
import BN from "bn.js";

/**
 * Inspect the Blaze (SPL) stake pool and report on its state.
 *
 * This script provides detailed information about the Blaze stake pool including:
 * - Total staked lamports
 * - Reserve stake balance (available for liquid withdrawals)
 * - Pool token supply
 * - Validator stake accounts and their balances
 * - Fees
 *
 * Usage:
 *   REACT_APP_SOLANA_NETWORK=mainnet-beta yarn workspace @sunrisestake/scripts run ts-node inspectBlaze.ts
 */

/** Validator stake info status enum from SPL stake pool */
enum ValidatorStakeInfoStatus {
  Active = 0,
  DeactivatingTransient = 1,
  ReadyForRemoval = 2,
  DeactivatingValidator = 3,
  DeactivatingAll = 4,
}

/**
 * Validator list entry structure matching SPL stake pool ValidatorStakeInfo.
 * Layout (73 bytes total):
 * - active_stake_lamports: u64 (8 bytes)
 * - transient_stake_lamports: u64 (8 bytes)
 * - last_update_epoch: u64 (8 bytes)
 * - transient_seed_suffix: u64 (8 bytes)
 * - unused: u32 (4 bytes)
 * - validator_seed_suffix: u32 (4 bytes)
 * - status: u8 (1 byte)
 * - vote_account_address: Pubkey (32 bytes)
 */
interface ValidatorStakeInfo {
  activeStakeLamports: BN;
  transientStakeLamports: BN;
  lastUpdateEpoch: BN;
  transientSeedSuffix: BN;
  unused: number;
  validatorSeedSuffix: number;
  status: number;
  voteAccountAddress: PublicKey;
}

const VALIDATOR_STAKE_INFO_SIZE = 73;
// Header is: u8 accountType + u32 maxValidators + u32 vec_length (borsh vec encoding)
const VALIDATOR_LIST_HEADER_SIZE = 9;

const ValidatorStakeInfoLayout = struct<ValidatorStakeInfo>([
  u64("activeStakeLamports"),
  u64("transientStakeLamports"),
  u64("lastUpdateEpoch"),
  u64("transientSeedSuffix"),
  u32("unused"),
  u32("validatorSeedSuffix"),
  u8("status"),
  publicKey("voteAccountAddress"),
]);

interface ValidatorList {
  accountType: number;
  maxValidators: number;
  validators: ValidatorStakeInfo[];
}

const decodeValidatorList = (data: Buffer): ValidatorList => {
  const accountType = data.readUInt8(0);
  const maxValidators = data.readUInt32LE(1);

  const validatorsData = data.slice(VALIDATOR_LIST_HEADER_SIZE);
  const numValidators = Math.floor(
    validatorsData.length / VALIDATOR_STAKE_INFO_SIZE
  );

  const validators: ValidatorStakeInfo[] = [];
  for (let i = 0; i < numValidators; i++) {
    const offset = i * VALIDATOR_STAKE_INFO_SIZE;
    const entryData = validatorsData.slice(
      offset,
      offset + VALIDATOR_STAKE_INFO_SIZE
    );
    if (entryData.length === VALIDATOR_STAKE_INFO_SIZE) {
      const validator = ValidatorStakeInfoLayout.decode(entryData);
      // Only include validators that are not empty (have a valid vote account)
      if (!validator.voteAccountAddress.equals(PublicKey.default)) {
        validators.push(validator);
      }
    }
  }

  return { accountType, maxValidators, validators };
};

const toSol = (lamports: BN | number): string => {
  const value = typeof lamports === "number" ? lamports : lamports.toNumber();
  return (value / 1e9).toFixed(4);
};

const toSolBN = (lamports: BN): string => {
  // Use BN division to avoid overflow, then convert remainder for decimals
  const sol = lamports.div(new BN(1e9));
  const remainder = lamports.mod(new BN(1e9));
  const decimal = remainder.toNumber() / 1e9;
  return (sol.toNumber() + decimal).toFixed(4);
};

const toSolNumber = (lamports: BN | number): number => {
  if (typeof lamports === "number") {
    return lamports / 1e9;
  }
  // For BN, use division to handle large numbers
  const sol = lamports.div(new BN(1e9));
  const remainder = lamports.mod(new BN(1e9));
  return sol.toNumber() + remainder.toNumber() / 1e9;
};

const formatFee = (fee: { numerator: BN; denominator: BN }): string => {
  const num = fee.numerator.toNumber();
  const denom = fee.denominator.toNumber();
  if (denom === 0) return "0%";
  return `${((num / denom) * 100).toFixed(4)}%`;
};

const getStatusString = (status: number): string => {
  switch (status) {
    case ValidatorStakeInfoStatus.Active:
      return "Active";
    case ValidatorStakeInfoStatus.DeactivatingTransient:
      return "DeactivatingTransient";
    case ValidatorStakeInfoStatus.ReadyForRemoval:
      return "ReadyForRemoval";
    case ValidatorStakeInfoStatus.DeactivatingValidator:
      return "DeactivatingValidator";
    case ValidatorStakeInfoStatus.DeactivatingAll:
      return "DeactivatingAll";
    default:
      return `Unknown(${status})`;
  }
};

const STAKE_POOL_PROGRAM_ID = new PublicKey(
  "SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"
);

const findStakeProgramAddress = (
  voteAccountAddress: PublicKey,
  stakePoolAddress: PublicKey
): PublicKey => {
  const [address] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake"),
      stakePoolAddress.toBuffer(),
      voteAccountAddress.toBuffer(),
    ],
    STAKE_POOL_PROGRAM_ID
  );
  return address;
};

(async () => {
  const network =
    (process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork) ||
    "mainnet-beta";

  console.log(`\n========================================`);
  console.log(`  BLAZE STAKE POOL INSPECTION REPORT`);
  console.log(`========================================`);
  console.log(`Network: ${network}\n`);

  const envConfig = Environment[network];
  const blazePoolAddress = envConfig.blaze.pool;
  const bsolMint = envConfig.blaze.bsolMint;

  console.log(`Pool Address: ${blazePoolAddress.toBase58()}`);
  console.log(`bSOL Mint: ${bsolMint.toBase58()}\n`);

  const rpcUrl =
    process.env.ANCHOR_PROVIDER_URL ||
    (network === "mainnet-beta"
      ? envConfig.heliusUrl || clusterApiUrl("mainnet-beta")
      : clusterApiUrl(network as any));

  const connection = new Connection(rpcUrl, "confirmed");

  // Get stake pool account
  console.log("Fetching stake pool data...\n");
  const stakePool = await getStakePoolAccount(connection, blazePoolAddress);

  // Get current epoch
  const epochInfo = await connection.getEpochInfo();
  console.log(`Current Epoch: ${epochInfo.epoch}`);
  console.log(`Pool Last Updated Epoch: ${stakePool.lastUpdateEpoch.toString()}`);
  const updateRequired = !stakePool.lastUpdateEpoch.eqn(epochInfo.epoch);
  console.log(`Update Required: ${updateRequired ? "YES" : "No"}\n`);

  // Pool summary
  console.log(`----------------------------------------`);
  console.log(`  POOL SUMMARY`);
  console.log(`----------------------------------------`);
  console.log(`Total Staked: ${toSol(stakePool.totalLamports)} SOL`);
  console.log(`Pool Token Supply: ${toSol(stakePool.poolTokenSupply)} bSOL`);

  // Calculate exchange rate
  const totalLamports = stakePool.totalLamports.toNumber();
  const poolTokenSupply = stakePool.poolTokenSupply.toNumber();
  const exchangeRate =
    poolTokenSupply > 0 ? totalLamports / poolTokenSupply : 1;
  console.log(`Exchange Rate: 1 bSOL = ${exchangeRate.toFixed(6)} SOL`);
  console.log(`Last Epoch Total Lamports: ${toSol(stakePool.lastEpochTotalLamports)} SOL`);
  console.log(`Last Epoch Pool Token Supply: ${toSol(stakePool.lastEpochPoolTokenSupply)} bSOL\n`);

  // Get reserve stake account
  console.log(`----------------------------------------`);
  console.log(`  RESERVE STAKE (Liquid Withdrawal Pool)`);
  console.log(`----------------------------------------`);
  const reserveStakeInfo = await connection.getAccountInfo(
    stakePool.reserveStake
  );
  const reserveLamports = reserveStakeInfo?.lamports || 0;
  const minReserveRentExempt = await connection.getMinimumBalanceForRentExemption(200); // stake account size
  const availableReserve = Math.max(0, reserveLamports - minReserveRentExempt);

  console.log(`Reserve Account: ${stakePool.reserveStake.toBase58()}`);
  console.log(`Reserve Balance: ${toSol(reserveLamports)} SOL`);
  console.log(`Rent Exempt Minimum: ${toSol(minReserveRentExempt)} SOL`);
  console.log(`Available for Liquid Withdrawal: ${toSol(availableReserve)} SOL`);
  console.log(`  (${((availableReserve / totalLamports) * 100).toFixed(2)}% of total staked)\n`);

  // Fees
  console.log(`----------------------------------------`);
  console.log(`  FEES`);
  console.log(`----------------------------------------`);
  console.log(`Epoch Fee: ${formatFee(stakePool.epochFee)}`);
  console.log(`SOL Deposit Fee: ${formatFee(stakePool.solDepositFee)}`);
  console.log(`SOL Withdrawal Fee: ${formatFee(stakePool.solWithdrawalFee)}`);
  console.log(`Stake Deposit Fee: ${formatFee(stakePool.stakeDepositFee)}`);
  console.log(`Stake Withdrawal Fee: ${formatFee(stakePool.stakeWithdrawalFee)}`);
  console.log(`SOL Referral Fee: ${stakePool.solReferralFee}%`);
  console.log(`Stake Referral Fee: ${stakePool.stakeReferralFee}%\n`);

  // Manager info
  console.log(`----------------------------------------`);
  console.log(`  AUTHORITIES`);
  console.log(`----------------------------------------`);
  console.log(`Manager: ${stakePool.manager.toBase58()}`);
  console.log(`Staker: ${stakePool.staker.toBase58()}`);
  console.log(`Stake Deposit Authority: ${stakePool.stakeDepositAuthority.toBase58()}`);
  if (stakePool.solDepositAuthority) {
    console.log(`SOL Deposit Authority: ${stakePool.solDepositAuthority.toBase58()}`);
  }
  if (stakePool.solWithdrawAuthority) {
    console.log(`SOL Withdraw Authority: ${stakePool.solWithdrawAuthority.toBase58()}`);
  }
  console.log(`Manager Fee Account: ${stakePool.managerFeeAccount.toBase58()}\n`);

  // Preferred validators
  if (stakePool.preferredDepositValidatorVoteAddress) {
    console.log(`Preferred Deposit Validator: ${stakePool.preferredDepositValidatorVoteAddress.toBase58()}`);
  }
  if (stakePool.preferredWithdrawValidatorVoteAddress) {
    console.log(`Preferred Withdraw Validator: ${stakePool.preferredWithdrawValidatorVoteAddress.toBase58()}`);
  }

  // Validator list
  console.log(`----------------------------------------`);
  console.log(`  VALIDATOR LIST`);
  console.log(`----------------------------------------`);
  console.log(`Validator List Account: ${stakePool.validatorList.toBase58()}\n`);

  const validatorListInfo = await connection.getAccountInfo(
    stakePool.validatorList
  );
  if (!validatorListInfo) {
    console.log("ERROR: Could not fetch validator list account\n");
  } else {
    const validatorList = decodeValidatorList(validatorListInfo.data);

    console.log(`Max Validators: ${validatorList.maxValidators}`);
    console.log(`Active Validators: ${validatorList.validators.length}\n`);

    // Calculate totals using BN to avoid overflow
    let totalActiveStake = new BN(0);
    let totalTransientStake = new BN(0);

    // Group validators by status
    const activeValidators = validatorList.validators.filter(
      (v) => v.status === ValidatorStakeInfoStatus.Active
    );
    const deactivatingValidators = validatorList.validators.filter(
      (v) => v.status !== ValidatorStakeInfoStatus.Active
    );

    console.log(`Validators by Status:`);
    console.log(`  Active: ${activeValidators.length}`);
    console.log(`  Deactivating/Removing: ${deactivatingValidators.length}\n`);

    // Sort validators by active stake (descending)
    const sortedValidators = [...validatorList.validators].sort((a, b) =>
      b.activeStakeLamports.cmp(a.activeStakeLamports)
    );

    console.log(`Top Validators by Active Stake:`);
    console.log(`${"Vote Account".padEnd(48)} | ${"Active Stake".padStart(15)} | ${"Transient".padStart(12)} | Status`);
    console.log(`${"─".repeat(48)}-|-${"─".repeat(15)}-|-${"─".repeat(12)}-|--------`);

    // Show top 20 validators or all if less
    const displayCount = Math.min(20, sortedValidators.length);
    for (let i = 0; i < displayCount; i++) {
      const validator = sortedValidators[i];
      totalActiveStake = totalActiveStake.add(validator.activeStakeLamports);
      totalTransientStake = totalTransientStake.add(validator.transientStakeLamports);

      const voteAccount = validator.voteAccountAddress.toBase58();
      const activeStake = toSolNumber(validator.activeStakeLamports);
      const transientStake = toSolNumber(validator.transientStakeLamports);
      const status = getStatusString(validator.status);

      console.log(
        `${voteAccount.padEnd(48)} | ${activeStake.toFixed(2).padStart(12)} SOL | ${transientStake.toFixed(2).padStart(9)} SOL | ${status}`
      );
    }

    // Add remaining validators to totals
    for (let i = displayCount; i < sortedValidators.length; i++) {
      totalActiveStake = totalActiveStake.add(sortedValidators[i].activeStakeLamports);
      totalTransientStake = totalTransientStake.add(sortedValidators[i].transientStakeLamports);
    }

    if (sortedValidators.length > displayCount) {
      console.log(`... and ${sortedValidators.length - displayCount} more validators`);
    }

    // Calculate totals for only active validators (status === Active)
    let activeOnlyStake = new BN(0);
    for (const v of validatorList.validators) {
      if (v.status === ValidatorStakeInfoStatus.Active) {
        activeOnlyStake = activeOnlyStake.add(v.activeStakeLamports).add(v.transientStakeLamports);
      }
    }

    console.log(`\n----------------------------------------`);
    console.log(`  STAKE DISTRIBUTION SUMMARY`);
    console.log(`----------------------------------------`);
    console.log(`Total Active Stake (all validators): ${toSolBN(totalActiveStake)} SOL`);
    console.log(`Total Transient Stake: ${toSolBN(totalTransientStake)} SOL`);
    console.log(`Stake in Active-status validators only: ${toSolBN(activeOnlyStake)} SOL`);
    console.log(`Reserve Stake: ${toSol(reserveLamports)} SOL`);

    const calculatedActiveOnly = activeOnlyStake.add(new BN(reserveLamports));
    console.log(`\nCalculated Total (active validators + reserve): ${toSolBN(calculatedActiveOnly)} SOL`);
    console.log(`Pool Reported Total: ${toSol(totalLamports)} SOL`);

    const difference = calculatedActiveOnly.sub(stakePool.totalLamports).abs();
    if (difference.gt(new BN(1000000000))) {
      // More than 1 SOL difference
      console.log(`  Note: Difference of ${toSolBN(difference)} SOL (may include deactivating validators or timing differences)`);
    }
  }

  // Rebalancing recommendation
  console.log(`\n========================================`);
  console.log(`  REBALANCING ANALYSIS`);
  console.log(`========================================`);
  console.log(`\nFor rebalancing from SPL stake pool to Marinade liquidity pool:\n`);

  console.log(`Option 1: Liquid Withdrawal (withdrawSol)`);
  console.log(`  Available: ${toSol(availableReserve)} SOL`);
  console.log(`  Withdrawal Fee: ${formatFee(stakePool.solWithdrawalFee)}`);
  if (availableReserve > 0) {
    console.log(`  Status: AVAILABLE for immediate withdrawal`);
  } else {
    console.log(`  Status: NOT AVAILABLE - reserve is empty or near rent-exempt minimum`);
  }

  console.log(`\nOption 2: Stake Withdrawal (withdrawStake)`);
  console.log(`  Available: ${toSol(totalLamports - reserveLamports)} SOL (via validator stake accounts)`);
  console.log(`  Withdrawal Fee: ${formatFee(stakePool.stakeWithdrawalFee)}`);
  console.log(`  Status: AVAILABLE - requires deactivation period (1+ epochs)`);

  console.log(`\n========================================\n`);
})().catch(console.error);
