use crate::error::ErrorCode;
use crate::state::{EpochReportAccount, LockAccount, State};
use crate::utils::seeds::{EPOCH_REPORT_ACCOUNT, LOCK_TOKEN_ACCOUNT};
use crate::utils::token::transfer_to;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts, Clone)]
#[instruction(lamports: u64)]
pub struct AddLockedGSol<'info> {
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
    constraint = lock_account.owner == authority.key() @ ErrorCode::LockAccountIncorrectOwner,
    constraint = lock_account.state_address == state.key() @ ErrorCode::LockAccountIncorrectState,
    constraint = lock_account.start_epoch.is_some() @ ErrorCode::LockAccountNotLocked,
    constraint = lock_account.updated_to_epoch.unwrap() == clock.epoch @ ErrorCode::LockAccountNotUpdated,
    )]
    pub lock_account: Box<Account<'info, LockAccount>>,

    #[account(
    mut,
    token::mint = gsol_mint,
    token::authority = authority.key(),
    )]
    pub source_gsol_account: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    seeds = [state.key().as_ref(), LOCK_TOKEN_ACCOUNT, authority.key().as_ref()],
    bump, // TODO consider storing this in the lock account?
    token::mint = gsol_mint,
    token::authority = lock_account,
    )]
    pub lock_gsol_account: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump,
    constraint = epoch_report_account.epoch == clock.epoch @ ErrorCode::InvalidEpochReportAccount
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn add_locked_gsol_handler(ctx: Context<AddLockedGSol>, lamports: u64) -> Result<()> {
    ctx.accounts.lock_account.calculate_and_add_yield_accrued(
        &ctx.accounts.epoch_report_account,
        &ctx.accounts.lock_gsol_account,
    )?;

    transfer_to(
        lamports,
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.source_gsol_account.to_account_info(),
        &ctx.accounts.lock_gsol_account.to_account_info(),
        &ctx.accounts.token_program,
    )?;

    Ok(())
}
