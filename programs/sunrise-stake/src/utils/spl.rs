use anchor_lang::prelude::*;
use anchor_lang::solana_program::borsh::try_from_slice_unchecked;
use spl_stake_pool::state::StakePool;

pub fn deserialize_spl_stake_pool(stake_pool_account: &AccountInfo) -> Result<StakePool> {
    try_from_slice_unchecked::<StakePool>(&stake_pool_account.data.borrow())
        .map_err(|_| ErrorCode::AccountDidNotDeserialize.into())
}

pub fn calc_lamports_from_bsol_amount(stake_pool: &StakePool, bsol_balance: u64) -> Result<u64> {
    Ok(stake_pool
        .calc_lamports_withdraw_amount(bsol_balance)
        .unwrap())
}

pub fn calc_bsol_from_lamports(stake_pool: &StakePool, lamports: u64) -> Result<u64> {
    Ok(stake_pool.calc_pool_tokens_for_deposit(lamports).unwrap())
}

#[allow(dead_code)]
pub fn calc_blaze_sol_withdrawal_fee(stake_pool: &StakePool, pool_tokens: u64) -> Result<u64> {
    Ok(stake_pool
        .calc_pool_tokens_stake_withdrawal_fee(pool_tokens)
        .unwrap())
}

#[allow(dead_code)]
pub fn calc_blaze_stake_withdrawal_fee(stake_pool: &StakePool, pool_tokens: u64) -> Result<u64> {
    Ok(stake_pool
        .calc_pool_tokens_stake_withdrawal_fee(pool_tokens)
        .unwrap())
}