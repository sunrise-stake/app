use std::ops::Deref;
use crate::state::{EpochReportAccount, State};
use crate::utils::{marinade, report};
use crate::utils::marinade::CalculateExtractableYieldProperties;
use crate::utils::seeds::{BSOL_ACCOUNT, MSOL_ACCOUNT};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;

#[derive(Accounts, Clone)]
#[instruction(
    epoch: u64,
    previous_epoch_report_account_bump: u8,
)]
pub struct ExtractToTreasury<'info> {
    #[account(
    has_one = treasury,
    has_one = marinade_state,
    has_one = blaze_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    /// CHECK: Checked
    pub blaze_state: AccountInfo<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    pub gsol_mint: Box<Account<'info, Mint>>,

    pub bsol_mint: Box<Account<'info, Mint>>,

    pub liq_pool_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

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
    pub treasury: SystemAccount<'info>, // sunrise-stake treasury

    #[account(
    init_if_needed,
    space = EpochReportAccount::SPACE,
    payer = payer,
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT, &epoch.to_be_bytes()],
    bump
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    #[account(
        seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT, &(epoch - 1).to_be_bytes()],
        bump = previous_epoch_report_account_bump
    )]
    pub previous_epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn extract_to_treasury_handler(ctx: Context<ExtractToTreasury>) -> Result<()> {
    // TODO at present, this withdraws all msol yield. In future, we should be able to choose how much to withdraw
    let calculate_yield_accounts: CalculateExtractableYieldProperties = ctx.accounts.deref().into();
    let extractable_yield = marinade::calculate_extractable_yield(
        &calculate_yield_accounts
    )?;

    // update the epoch report with the yield that is being extracted
    let update_epoch_report_properties
        = ctx.accounts.deref().into();
    report::update_epoch_report(update_epoch_report_properties, extractable_yield)?;

    let extractable_yield_msol =
        marinade::calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), extractable_yield)?;

    // TODO later change to use "slow unstake" rather than incur liq pool fees

    msg!("Withdrawing {} msol to treasury", extractable_yield);
    let accounts = ctx.accounts.deref().into();
    marinade::unstake(&accounts, extractable_yield_msol)?;

    Ok(())
}
