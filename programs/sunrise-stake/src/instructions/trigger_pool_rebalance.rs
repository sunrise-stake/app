use crate::state::{EpochReportAccount, State};
use crate::utils::marinade;
use crate::utils::seeds::{EPOCH_REPORT_ACCOUNT, MSOL_ACCOUNT, ORDER_UNSTAKE_TICKET_ACCOUNT};
use crate::utils::system;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
#[instruction(
epoch: u64,
order_unstake_ticket_index: u64,
order_unstake_ticket_account_bump: u8,
)]
pub struct TriggerPoolRebalance<'info> {
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
    mut,
    // This will be initialised programmatically if it is needed
    // init,
    // payer = gsol_token_account_authority,
    // space = MARINADE_TICKET_ACCOUNT_SPACE,
    seeds = [state.key().as_ref(), ORDER_UNSTAKE_TICKET_ACCOUNT, &epoch.to_be_bytes(), &order_unstake_ticket_index.to_be_bytes()],
    bump = order_unstake_ticket_account_bump
    )]
    /// CHECK: Checked in marinade program
    pub order_unstake_ticket_account: UncheckedAccount<'info>,

    #[account(
    mut,
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump = epoch_report_account.bump,
    constraint = epoch == clock.epoch
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn trigger_pool_rebalance_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, TriggerPoolRebalance<'info>>,
    _epoch: u64,
    index: u64,
    order_unstake_ticket_account_bump: u8,
) -> Result<()> {
    msg!("Checking liq_pool pool balance");
    let calculate_pool_balance_props = ctx.accounts.deref().into();
    let amounts = marinade::calculate_pool_balance_amounts(&calculate_pool_balance_props, 0)?;

    if amounts.amount_to_order_delayed_unstake > 0 {
        let msol_lamports = marinade::calc_msol_from_lamports(
            ctx.accounts.marinade_state.as_ref(),
            amounts.amount_to_order_delayed_unstake,
        )?;

        // TODO move to just using init
        msg!("Creating order unstake ticket account");
        let create_ticket_props = ctx.accounts.deref().into();
        system::create_order_unstake_ticket_account(
            &create_ticket_props,
            order_unstake_ticket_account_bump,
            index,
        )?;

        msg!(
            "Ordering a delayed unstake of {} msol lamports",
            msol_lamports
        );
        let order_unstake_props = ctx.accounts.deref().into();
        marinade::order_unstake(&order_unstake_props, msol_lamports)?;

        // updating the internal record of delayed unstakes ordered.
        ctx.accounts
            .epoch_report_account
            .add_ticket(amounts.amount_to_order_delayed_unstake, &ctx.accounts.clock)?;
        ctx.accounts.epoch_report_account.current_gsol_supply = ctx.accounts.gsol_mint.supply;
    }

    Ok(())
}
