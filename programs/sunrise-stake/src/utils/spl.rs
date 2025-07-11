use anchor_lang::prelude::*;
use anchor_lang::solana_program::borsh0_10::try_from_slice_unchecked;

/// Fee structure matching the spl-stake-pool Fee type
#[derive(Clone, Copy, Debug, Default, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct Fee {
    /// Denominator of the fee ratio
    pub denominator: u64,
    /// Numerator of the fee ratio
    pub numerator: u64,
}

/// StakePool struct matching the spl-stake-pool StakePool account structure
/// This is a simplified version with only the fields we need
#[derive(Clone, Debug, Default, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct StakePool {
    pub account_type: u8,
    pub manager: Pubkey,
    pub staker: Pubkey,
    pub stake_deposit_authority: Pubkey,
    pub stake_withdraw_bump_seed: u8,
    pub validator_list: Pubkey,
    pub reserve_stake: Pubkey,
    pub pool_mint: Pubkey,
    pub manager_fee_account: Pubkey,
    pub token_program_id: Pubkey,
    pub total_lamports: u64,
    pub pool_token_supply: u64,
    pub last_update_epoch: u64,
    pub lockup: Lockup,
    pub epoch_fee: Fee,
    pub next_epoch_fee: Option<Fee>,
    pub preferred_deposit_validator_vote_address: Option<Pubkey>,
    pub preferred_withdraw_validator_vote_address: Option<Pubkey>,
    pub stake_deposit_fee: Fee,
    pub stake_withdrawal_fee: Fee,
    pub next_stake_withdrawal_fee: Option<Fee>,
    pub stake_referral_fee: u8,
    pub sol_deposit_authority: Option<Pubkey>,
    pub sol_deposit_fee: Fee,
    pub sol_referral_fee: u8,
    pub sol_withdraw_authority: Option<Pubkey>,
    pub sol_withdrawal_fee: Fee,
    pub next_sol_withdrawal_fee: Option<Fee>,
    pub last_epoch_pool_token_supply: u64,
    pub last_epoch_total_lamports: u64,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct Lockup {
    pub unix_timestamp: i64,
    pub epoch: u64,
    pub custodian: Pubkey,
}

impl Fee {
    /// Apply the fee to the given amount
    pub fn apply(&self, amount: u64) -> Option<u128> {
        if self.denominator == 0 {
            return Some(amount as u128);
        }
        (amount as u128)
            .checked_mul(self.numerator as u128)?
            .checked_div(self.denominator as u128)
    }
}

pub fn deserialize_spl_stake_pool(stake_pool_account: &AccountInfo) -> Result<StakePool> {
    try_from_slice_unchecked::<StakePool>(&stake_pool_account.data.borrow())
        .map_err(|_| ErrorCode::AccountDidNotDeserialize.into())
}

/// Calculate lamports amount on withdrawal
#[inline]
pub fn calc_lamports_withdraw_amount(stake_pool: &StakePool, pool_tokens: u64) -> Option<u64> {
    let numerator = (pool_tokens as u128).checked_mul(stake_pool.total_lamports as u128)?;
    let denominator = stake_pool.pool_token_supply as u128;
    if numerator < denominator || denominator == 0 {
        Some(0)
    } else {
        u64::try_from(numerator.checked_div(denominator)?).ok()
    }
}

pub fn calc_lamports_from_bsol_amount(stake_pool: &StakePool, bsol_balance: u64) -> Result<u64> {
    Ok(calc_lamports_withdraw_amount(stake_pool, bsol_balance).unwrap())
}

/// Calculate pool tokens for a deposit amount
#[inline]
pub fn calc_pool_tokens_for_deposit(stake_pool: &StakePool, stake_lamports: u64) -> Option<u64> {
    if stake_pool.total_lamports == 0 || stake_pool.pool_token_supply == 0 {
        return Some(stake_lamports);
    }
    u64::try_from(
        (stake_lamports as u128)
            .checked_mul(stake_pool.pool_token_supply as u128)?
            .checked_div(stake_pool.total_lamports as u128)?,
    )
    .ok()
}

pub fn calc_bsol_from_lamports(stake_pool: &StakePool, lamports: u64) -> Result<u64> {
    Ok(calc_pool_tokens_for_deposit(stake_pool, lamports).unwrap())
}

/// Calculate stake withdrawal fee in pool tokens
#[inline]
pub fn calc_pool_tokens_stake_withdrawal_fee(stake_pool: &StakePool, pool_tokens: u64) -> Option<u64> {
    // Create a Fee struct from the stake_withdrawal_fee fields
    let fee = Fee {
        denominator: stake_pool.stake_withdrawal_fee.denominator,
        numerator: stake_pool.stake_withdrawal_fee.numerator,
    };
    u64::try_from(fee.apply(pool_tokens)?).ok()
}

#[allow(dead_code)]
pub fn calc_blaze_sol_withdrawal_fee(stake_pool: &StakePool, pool_tokens: u64) -> Result<u64> {
    Ok(calc_pool_tokens_stake_withdrawal_fee(stake_pool, pool_tokens).unwrap())
}

#[allow(dead_code)]
pub fn calc_blaze_stake_withdrawal_fee(stake_pool: &StakePool, pool_tokens: u64) -> Result<u64> {
    Ok(calc_pool_tokens_stake_withdrawal_fee(stake_pool, pool_tokens).unwrap())
}
