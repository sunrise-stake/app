use crate::state::{EpochReportAccount, State, TicketAccountData};
use crate::utils::marinade;
use crate::utils::marinade::ClaimUnstakeTicketProperties;
use crate::utils::seeds::{
    MSOL_ACCOUNT, ORDER_UNSTAKE_TICKET_ACCOUNT, EPOCH_REPORT_ACCOUNT,
};
use crate::utils::system;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
#[instruction()]
pub struct RecoverTickets<'info> {
    #[account(
    has_one = marinade_state,
    has_one = gsol_mint,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub liq_pool_mint: Box<Account<'info, Mint>>,

    /// CHECK: Checked in marinade program
    pub liq_pool_mint_authority: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg_authority: SystemAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub treasury_msol_account: AccountInfo<'info>,

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
    token::mint = liq_pool_mint,
    // use the same authority PDA for this and the msol token account
    token::authority = get_msol_from_authority
    )]
    pub liq_pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub reserve_pda: UncheckedAccount<'info>,

    #[account(
    init_if_needed,
    space = EpochReportAccount::SPACE,
    payer = payer,
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT, &epoch.to_be_bytes()],
    bump
    )]
    pub epoch_report_account:
        Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn recover_tickets<'info>(
    ctx: Context<'_, '_, '_, 'info, RecoverTickets<'info>>,
    order_unstake_ticket_account_bump: u8,
    _previous_order_unstake_ticket_management_account_bump: u8,
) -> Result<()> {
    // This ensures we only try to recover tickets for an epoch in the past
    require_gt!(
        ctx.accounts.clock.epoch,
        ctx.accounts.epoch_report_account.epoch,
        ErrorCode::DelayedUnstakeTicketsNotYetClaimable
    );

    // if the remaining accounts exceeds the amount of tickets, then fail early
    require_gte!(
        ctx.accounts.epoch_report_account.tickets,
        ctx.remaining_accounts.len() as u64,
        ErrorCode::TooManyTicketsClaimed
    );

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

    if claimed_lamports == ctx.accounts.epoch_report_account.total_ordered_lamports {
        if ctx.remaining_accounts.len() == ctx.accounts.epoch_report_account.tickets {
            // all tickets are recovered. Now we update the epoch report account to the current epoch
            ctx.accounts.epoch_report_account.epoch = ctx.accounts.clock.epoch;
            ctx.accounts.epoch_report_account.tickets = 0;
            ctx.accounts.epoch_report_account.total_ordered_lamports = 0;
        } else {
            // more tickets to recover, but we have already recovered all the lamports
            // this is a failure state, and should only happen if something else has gone wrong
            return Err(ErrorCode::RemainingUnclaimableTicketAmount.into());
        }
    } else {
        // we have recovered some tickets, but not all of them
        // update the epoch report account to reflect this, but do not update the epoch yet
        ctx.accounts.epoch_report_account.tickets -= ctx.remaining_accounts.len() as u64;
        ctx.accounts.epoch_report_account.total_ordered_lamports -= claimed_lamports;
    }

    Ok(())
}
