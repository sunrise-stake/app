use crate::state::{EpochReportAccount, LockAccount, State};
use crate::utils::seeds::{LOCK_ACCOUNT, EPOCH_REPORT_ACCOUNT, LOCK_TOKEN_ACCOUNT};
use crate::utils::token::transfer_to;
use crate::utils::{marinade, marinade::amount_to_be_deposited_in_liq_pool};
use crate::error::ErrorCode;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
#[instruction(lamports: u64)]
pub struct LockGSol<'info> {
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
    init,
    space = LockAccount::SPACE,
    seeds = [state.key().as_ref(), LOCK_ACCOUNT, authority.key().as_ref()],
    bump,
    payer = payer,
    )]
    pub lock_account: Box<Account<'info, LockAccount>>,

    #[account(
    mut,
    token::mint = gsol_mint,
    token::authority = authority.key(),
    )]
    pub source_gsol_account: Account<'info, TokenAccount>,

    #[account(
    init,
    seeds = [state.key().as_ref(), LOCK_TOKEN_ACCOUNT, authority.key().as_ref()],
    bump,
    payer = payer,
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

pub fn lock_gsol_handler(ctx: Context<LockGSol>, lamports: u64) -> Result<()> {
    transfer_to(
        lamports,
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.source_gsol_account.to_account_info(),
        &ctx.accounts.lock_gsol_account.to_account_info(),
        &ctx.accounts.token_program,
    )?;

    ctx.accounts.lock_account.state_address = ctx.accounts.state.key();
    ctx.accounts.lock_account.start_epoch = ctx.accounts.clock.epoch;
    ctx.accounts.lock_account.owner = ctx.accounts.authority.key();
    ctx.accounts.lock_account.sunrise_yield_at_start = ctx
        .accounts
        .epoch_report_account
        .extractable_yield
        .checked_add(
            ctx.accounts.epoch_report_account.extracted_yield
        ).unwrap();
    Ok(())
}
