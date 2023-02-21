use crate::error::ErrorCode;
use crate::state::{EpochReportAccount, LockAccount, State};
use crate::utils::seeds::{EPOCH_REPORT_ACCOUNT, LOCK_ACCOUNT, LOCK_TOKEN_ACCOUNT};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts, Clone)]
pub struct UpdateLockAccount<'info> {
    #[account(
        has_one = gsol_mint
    )]
    pub state: Box<Account<'info, State>>,
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
    mut,
    // close = payer,
    constraint = lock_account.start_epoch.is_some() @ ErrorCode::LockAccountNotLocked,
    constraint = lock_account.updated_to_epoch.unwrap() < clock.epoch @ ErrorCode::LockAccountAlreadyUpdated,
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
    constraint = epoch_report_account.epoch == clock.epoch @ ErrorCode::InvalidEpochReportAccount
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn update_lock_account_handler(ctx: Context<UpdateLockAccount>) -> Result<()> {
    ctx.accounts.lock_account.updated_to_epoch = Some(ctx.accounts.clock.epoch);

    ctx.accounts.lock_account.calculate_and_add_yield_accrued(
        &ctx.accounts.epoch_report_account,
        &ctx.accounts.lock_gsol_account,
    )?;

    // TODO update NFT with the new value:
    // ctx.accounts.lock_account.yield_accrued_by_owner

    Ok(())
}
