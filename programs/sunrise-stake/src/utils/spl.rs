use anchor_lang::prelude::*;
use anchor_lang::solana_program::borsh0_10::try_from_slice_unchecked;
use crate::spl_stake_pool::accounts::StakePool;

/// Fee structure matching the spl-stake-pool Fee type
#[derive(Clone, Copy, Debug, Default, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct Fee {
    /// Denominator of the fee ratio
    pub denominator: u64,
    /// Numerator of the fee ratio
    pub numerator: u64,
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
