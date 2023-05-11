use crate::state::{EpochReportAccount, State};
use crate::utils::marinade;
use crate::utils::marinade::CalculateExtractableYieldProperties;
use crate::utils::seeds::{BSOL_ACCOUNT, EPOCH_REPORT_ACCOUNT, MSOL_ACCOUNT};
use crate::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
pub struct UpdateEpochReport<'info> {
    #[account(
    has_one = marinade_state,
    has_one = blaze_state,
    has_one = gsol_mint,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub marinade_state: Box<Account<'info, MarinadeState>>,

    /// CHECK: Must match state
    pub blaze_state: UncheckedAccount<'info>,

    pub msol_mint: Box<Account<'info, Mint>>,
    pub bsol_mint: Box<Account<'info, Mint>>,

    pub gsol_mint: Box<Account<'info, Mint>>,

    pub liq_pool_mint: Box<Account<'info, Mint>>,

    /// CHECK: Checked in marinade program
    pub liq_pool_mint_authority: UncheckedAccount<'info>,

    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: UncheckedAccount<'info>,

    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,

    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg_authority: SystemAccount<'info>,

    /// CHECK: Checked in marinade program
    pub treasury_msol_account: UncheckedAccount<'info>,

    pub get_msol_from: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state.msol_authority_bump
    )]
    pub get_msol_from_authority: SystemAccount<'info>, // sunrise-stake PDA

    #[account(
    token::mint = bsol_mint,
    token::authority = get_bsol_from_authority,
    )]
    pub get_bsol_from: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [state.key().as_ref(), BSOL_ACCOUNT],
    bump = state.bsol_authority_bump
    )]
    pub get_bsol_from_authority: SystemAccount<'info>, // sunrise-stake PDA

    #[account(
    token::mint = liq_pool_mint,
    // use the same authority PDA for this and the msol token account
    token::authority = get_msol_from_authority
    )]
    pub liq_pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump = epoch_report_account.bump,
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn update_epoch_report_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, UpdateEpochReport<'info>>,
) -> Result<()> {
    // we can update the epoch report if either
    // a) the account is at the current epoch or
    // b) the account is at the previous epoch and there are no open tickets

    let current_epoch = ctx.accounts.clock.epoch;
    let is_previous_epoch = ctx.accounts.epoch_report_account.epoch == current_epoch - 1;
    let is_current_epoch = ctx.accounts.epoch_report_account.epoch == current_epoch;
    let is_previous_epoch_and_no_open_tickets =
        is_previous_epoch && ctx.accounts.epoch_report_account.tickets == 0;

    require!(
        is_current_epoch || is_previous_epoch_and_no_open_tickets,
        ErrorCode::RemainingUnclaimableTicketAmount
    );

    ctx.accounts.epoch_report_account.epoch = ctx.accounts.clock.epoch;
    ctx.accounts.epoch_report_account.current_gsol_supply = ctx.accounts.gsol_mint.supply;

    let calculate_yield_accounts: CalculateExtractableYieldProperties = ctx.accounts.deref().into();
    let extractable_yield = marinade::calculate_extractable_yield(&calculate_yield_accounts)?;
    msg!("Extractable yield: {}", extractable_yield);
    ctx.accounts.epoch_report_account.extractable_yield = extractable_yield;

    Ok(())
}
