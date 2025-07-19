use crate::error::ErrorCode;
use crate::state::{EpochReportAccount, LockAccount, State};
use crate::utils::seeds::{
    EPOCH_REPORT_ACCOUNT, LOCK_ACCOUNT,
    LOCK_TOKEN_ACCOUNT,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

/** * Update the lock account without updating the NFT.
 * This is used when the lock account is updated but the NFT no longer exists
 * This can happen if the NFT was burned or transferred.
 */
#[derive(Accounts, Clone)]
pub struct UpdateLockAccountWithoutNft<'info> {
    #[account(
    has_one = gsol_mint
    )]
    pub state: Box<Account<'info, State>>,
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
    mut,
    constraint = lock_account.start_epoch.is_some() @ ErrorCode::LockAccountNotLocked,
    constraint = lock_account.updated_to_epoch.unwrap() < Clock::get().unwrap().epoch @ ErrorCode::LockAccountAlreadyUpdated,
    seeds = [state.key().as_ref(), LOCK_ACCOUNT, authority.key().as_ref()],
    bump = lock_account.bump,
    )]
    pub lock_account: Box<Account<'info, LockAccount>>,

    #[account(
    seeds = [state.key().as_ref(), LOCK_TOKEN_ACCOUNT, authority.key().as_ref()],
    bump, // TODO consider storing this in the lock account?
    token::mint = gsol_mint,
    token::authority = lock_account,
    )]
    pub lock_gsol_account: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump = epoch_report_account.bump,
    constraint = epoch_report_account.epoch == Clock::get().unwrap().epoch @ ErrorCode::InvalidEpochReportAccount
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,
}

pub fn update_lock_account_without_nft_handler(ctx: Context<UpdateLockAccountWithoutNft>) -> Result<()> {
    ctx.accounts.lock_account.updated_to_epoch = Some(Clock::get().unwrap().epoch);

    ctx.accounts.lock_account.calculate_and_add_yield_accrued(
        &ctx.accounts.epoch_report_account,
        &ctx.accounts.lock_gsol_account,
    )?;

    Ok(())
}
