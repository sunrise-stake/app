use crate::marinade::accounts::TicketAccountData as MarinadeTicketAccount;
use crate::marinade::program::MarinadeFinance;
use crate::state::{State, SunriseTicketAccount};
use crate::utils::marinade;
use crate::utils::seeds::MSOL_ACCOUNT;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction::transfer};
use std::ops::Deref;

#[derive(Accounts, Clone)]
pub struct ClaimUnstakeTicket<'info> {
    #[account(
    has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,
    /// CHECK: Validated in handler
    #[account(mut)]
    pub marinade_state: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub reserve_pda: UncheckedAccount<'info>,

    #[account(mut)]
    pub marinade_ticket_account: Account<'info, MarinadeTicketAccount>,

    #[account(
        mut,
        close = transfer_sol_to,
        has_one = marinade_ticket_account,
        constraint = sunrise_ticket_account.beneficiary == transfer_sol_to.key(),
    )]
    pub sunrise_ticket_account: Account<'info, SunriseTicketAccount>,

    #[account(
    mut,
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state.msol_authority_bump
    )]
    pub msol_authority: SystemAccount<'info>, // sunrise-stake PDA

    #[account(mut)]
    pub transfer_sol_to: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,

    pub marinade_program: Program<'info, MarinadeFinance>,

    pub system_program: Program<'info, System>,
}

pub fn claim_unstake_ticket_handler(ctx: Context<ClaimUnstakeTicket>) -> Result<()> {
    let accounts = ctx.accounts.deref().into();
    marinade::claim_unstake_ticket(&accounts)?;

    // transfer the released SOL to the beneficiary
    let lamports = ctx.accounts.marinade_ticket_account.lamports_amount;
    let ix = transfer(
        &ctx.accounts.msol_authority.key(),
        &ctx.accounts.transfer_sol_to.key(),
        lamports,
    );
    let bump = &[ctx.accounts.state.msol_authority_bump][..];
    let state_address = ctx.accounts.state.key();
    let seeds = &[state_address.as_ref(), MSOL_ACCOUNT, bump][..];
    invoke_signed(
        &ix,
        &[
            ctx.accounts.msol_authority.to_account_info(),
            ctx.accounts.transfer_sol_to.to_account_info(),
        ],
        &[seeds],
    )?;

    Ok(())
}
