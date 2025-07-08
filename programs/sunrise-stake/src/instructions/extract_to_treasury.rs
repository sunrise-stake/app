use crate::{
    error::ErrorCode,
    state::{EpochReportAccount, SunriseState},
    utils::marinade,
    utils::marinade::CalculateExtractableYieldProperties,
    utils::seeds::{BSOL_ACCOUNT, EPOCH_REPORT_ACCOUNT, MSOL_ACCOUNT},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::marinade::program::MarinadeFinance;
use crate::marinade::accounts::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
pub struct ExtractToTreasury<'info> {
    #[account(
    has_one = treasury,
    has_one = marinade_state,
    has_one = blaze_state,
    has_one = gsol_mint
    )]
    pub state: Box<Account<'info, SunriseState>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    /// CHECK: Must match state
    pub blaze_state: UncheckedAccount<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    pub gsol_mint: Box<Account<'info, Mint>>,

    pub bsol_mint: Box<Account<'info, Mint>>,

    pub liq_pool_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
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
    mut,
    token::mint = bsol_mint,
    token::authority = get_bsol_from_authority,
    )]
    pub get_bsol_from: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [state.key().as_ref(), BSOL_ACCOUNT],
    bump = state.bsol_authority_bump
    )]
    pub get_bsol_from_authority: SystemAccount<'info>, // sunrise-stake PDA

    #[account(mut)]
    /// CHECK: Matches state.treasury
    pub treasury: UncheckedAccount<'info>, // sunrise-stake treasury

    #[account(
    mut,
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump = epoch_report_account.bump,
    constraint = epoch_report_account.epoch == clock.epoch @ ErrorCode::InvalidEpochReportAccount
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn extract_to_treasury_handler(ctx: Context<ExtractToTreasury>) -> Result<()> {
    // TODO at present, this withdraws all msol yield. In future, we should be able to choose how much to withdraw
    let calculate_yield_accounts: CalculateExtractableYieldProperties = ctx.accounts.deref().into();
    let extractable_yield = marinade::calculate_extractable_yield(&calculate_yield_accounts)?;

    // update the epoch report with the yield that is being extracted
    ctx.accounts
        .epoch_report_account
        .add_extracted_yield(extractable_yield);
    ctx.accounts.epoch_report_account.current_gsol_supply = ctx.accounts.gsol_mint.supply;

    let extractable_yield_msol =
        marinade::calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), extractable_yield)?;

    // TODO later change to use "slow unstake" rather than incur liq pool fees

    msg!("Withdrawing {} msol to treasury", extractable_yield);
    let accounts = ctx.accounts.deref().into();
    marinade::unstake(&accounts, extractable_yield_msol)?;

    Ok(())
}
