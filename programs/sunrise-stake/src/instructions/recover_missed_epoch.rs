use crate::state::{EpochReportAccount, State, TicketAccountData};
use crate::utils::marinade;
use crate::utils::marinade::{CalculateExtractableYieldProperties, ClaimUnstakeTicketProperties};
use crate::utils::seeds::{BSOL_ACCOUNT, MSOL_ACCOUNT};
use crate::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

// If recover_tickets is missed for a given epoch, the epoch report account should still be on the old epoch
// However, as a failsafe, this function recovers any tickets that were missed, for example when upgrading the program
#[derive(Accounts, Clone)]
pub struct RecoverMissedEpoch<'info> {
    #[account(
    has_one = marinade_state,
    has_one = blaze_state,
    has_one = gsol_mint,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    /// CHECK: Must match state
    pub blaze_state: UncheckedAccount<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,
    pub bsol_mint: Box<Account<'info, Mint>>,

    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub liq_pool_mint: Box<Account<'info, Mint>>,

    /// CHECK: Checked in marinade program
    pub liq_pool_mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg_authority: SystemAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub treasury_msol_account: UncheckedAccount<'info>,

    #[account(
    mut,
    token::mint = msol_mint,
    token::authority = get_msol_from_authority,
    )]
    pub get_msol_from: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
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

    #[account(
    mut,
    token::mint = liq_pool_mint,
    // use the same authority PDA for this and the msol token account
    token::authority = get_msol_from_authority
    )]
    pub liq_pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub reserve_pda: UncheckedAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn recover_missed_epoch_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, RecoverMissedEpoch<'info>>,
) -> Result<()> {
    let mut claimed_lamports = 0;
    let mut props: ClaimUnstakeTicketProperties = ctx.accounts.deref().into();
    // All remaining accounts are previous epoch tickets that are now ready to be claimed.
    msg!("Tickets to claim: {}", ctx.remaining_accounts.len());
    for ticket in ctx.remaining_accounts.iter() {
        let ticket_account = TicketAccountData::try_from_slice(&ticket.data.borrow_mut())?;
        claimed_lamports += ticket_account.lamports_amount;

        msg!(
            "Claiming ticket {} with value {}",
            ticket.key(),
            ticket_account.lamports_amount
        );

        props.ticket_account = ticket.to_account_info();

        marinade::claim_unstake_ticket(&props)?;
    }

    if claimed_lamports > 0 {
        msg!(
            "Claimed {} lamports from tickets - depositing into liquidity pool",
            claimed_lamports
        );

        let add_liquidity_props = ctx.accounts.deref().into();
        let lamports_to_deposit = ctx.accounts.get_msol_from_authority.try_lamports()?;

        msg!(
            "Current balance of msol token authority {}, claiming amount {}",
            lamports_to_deposit,
            claimed_lamports
        );
        marinade::add_liquidity_from_pda(&add_liquidity_props, claimed_lamports)?;
    }

    Ok(())
}
