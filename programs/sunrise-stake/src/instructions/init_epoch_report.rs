use crate::state::{EpochReportAccount, State};
use crate::utils::marinade;
use crate::utils::marinade::CalculateExtractableYieldProperties;
use crate::utils::seeds::{BSOL_ACCOUNT, EPOCH_REPORT_ACCOUNT, MSOL_ACCOUNT};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
pub struct InitEpochReport<'info> {
    #[account(
    has_one = gsol_mint,
    has_one = marinade_state,
    has_one = blaze_state,
    has_one = update_authority,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub update_authority: Signer<'info>,

    pub marinade_state: Box<Account<'info, MarinadeState>>,

    /// CHECK: Must match state
    pub blaze_state: UncheckedAccount<'info>,

    pub msol_mint: Box<Account<'info, Mint>>,

    pub gsol_mint: Box<Account<'info, Mint>>,

    pub bsol_mint: Box<Account<'info, Mint>>,

    pub liq_pool_mint: Box<Account<'info, Mint>>,

    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: UncheckedAccount<'info>,

    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,

    #[account(
    token::mint = liq_pool_mint,
    // use the same authority PDA for this and the msol token account
    token::authority = get_msol_from_authority
    )]
    pub liq_pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub treasury_msol_account: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    token::mint = msol_mint,
    token::authority = get_msol_from_authority,
    )]
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

    /// CHECK: Matches state.treasury
    pub treasury: SystemAccount<'info>, // sunrise-stake treasury

    #[account(
    init,
    space = EpochReportAccount::SPACE,
    payer = payer,
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump,
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub fn init_epoch_report_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, InitEpochReport<'info>>,
    extracted_yield: u64,
) -> Result<()> {
    ctx.accounts.epoch_report_account.state_address = ctx.accounts.state.key();
    ctx.accounts.epoch_report_account.epoch = ctx.accounts.clock.epoch;
    ctx.accounts.epoch_report_account.tickets = 0;
    ctx.accounts.epoch_report_account.total_ordered_lamports = 0;
    ctx.accounts.epoch_report_account.current_gsol_supply = ctx.accounts.gsol_mint.supply;
    ctx.accounts.epoch_report_account.bump = *ctx.bumps.get("epoch_report_account").unwrap();

    let calculate_yield_accounts: CalculateExtractableYieldProperties = ctx.accounts.deref().into();
    let extractable_yield = marinade::calculate_extractable_yield(&calculate_yield_accounts)?;

    ctx.accounts.epoch_report_account.extractable_yield = extractable_yield;

    // we have to trust that the extracted amount is accurate,
    // as extracted yield is no longer managed by the program.
    // This is why this instruction is only callable by the update authority
    ctx.accounts.epoch_report_account.extracted_yield = extracted_yield;

    Ok(())
}
