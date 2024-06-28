use crate::state::State;
use crate::state::SunriseTicketAccount;
use crate::utils::marinade;
use crate::utils::marinade::{calc_lamports_from_msol_amount, calc_msol_from_lamports};
use crate::utils::seeds::{GSOL_MINT_AUTHORITY, MSOL_ACCOUNT};
use crate::utils::token::burn;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
pub struct OrderUnstake<'info> {
    #[account(
    has_one = treasury,
    has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account()]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(mut)]
    pub msol_mint: Account<'info, Mint>,

    #[account(
    constraint = gsol_mint.mint_authority == COption::Some(gsol_mint_authority.key()),
    )]
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(
    seeds = [
    state.key().as_ref(),
    GSOL_MINT_AUTHORITY,
    ],
    bump = state.gsol_mint_authority_bump,
    )]
    /// Used to ensure the correct GSOL mint is used
    pub gsol_mint_authority: SystemAccount<'info>,

    #[account(
    mut,
    token::mint = msol_mint,
    token::authority = get_msol_from_authority,
    )]
    pub get_msol_from: Account<'info, TokenAccount>,

    #[account(
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state.msol_authority_bump
    )]
    pub get_msol_from_authority: SystemAccount<'info>, // sunrise-stake PDA

    #[account(
    mut,
    token::authority = gsol_token_account_authority
    )]
    pub gsol_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    /// Owner of the gSOL
    pub gsol_token_account_authority: Signer<'info>,

    #[account(zero, rent_exempt = enforce)]
    /// CHECK: Checked in marinade program
    pub new_ticket_account: UncheckedAccount<'info>,

    #[account(init, space = SunriseTicketAccount::SPACE, payer = gsol_token_account_authority)]
    pub sunrise_ticket_account: Account<'info, SunriseTicketAccount>,

    #[account()]
    /// CHECK: Matches state.treasury
    pub treasury: UncheckedAccount<'info>, // sunrise-stake treasury

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
    pub system_program: Program<'info, System>,
}

pub fn order_unstake_handler(ctx: Context<OrderUnstake>, lamports: u64) -> Result<()> {
    let msol_lamports = calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), lamports)?;

    let lamports_converted =
        calc_lamports_from_msol_amount(ctx.accounts.marinade_state.as_ref(), msol_lamports)?;

    msg!(
        "Ordering unstake of {} MSOL (in lamports {}, out lamports {})",
        msol_lamports,
        lamports,
        lamports_converted
    );
    let accounts = ctx.accounts.deref().into();
    marinade::order_unstake(&accounts, msol_lamports)?;

    msg!("Ticket beneficiary {}", ctx.accounts.get_msol_from.owner);

    ctx.accounts.sunrise_ticket_account.state_address = ctx.accounts.state.key();
    ctx.accounts.sunrise_ticket_account.marinade_ticket_account =
        ctx.accounts.new_ticket_account.key();
    ctx.accounts.sunrise_ticket_account.beneficiary =
        ctx.accounts.gsol_token_account_authority.key();

    msg!("Burn GSol");
    burn(
        lamports,
        &ctx.accounts.gsol_mint.to_account_info(),
        &ctx.accounts.gsol_token_account_authority.to_account_info(),
        &ctx.accounts.gsol_token_account.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
    )?;

    let state = &mut ctx.accounts.state;
    state.marinade_minted_gsol = state.marinade_minted_gsol.checked_sub(lamports).unwrap();

    Ok(())
}
