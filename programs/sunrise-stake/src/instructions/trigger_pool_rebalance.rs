use crate::state::{OrderUnstakeTicketManagementAccount, State, TicketAccountData};
use crate::utils::marinade;
use crate::utils::marinade::ClaimUnstakeTicketProperties;
use crate::utils::seeds::{
    MSOL_ACCOUNT, ORDER_UNSTAKE_TICKET_ACCOUNT, ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT,
};
use crate::utils::system;
use anchor_lang::prelude::*;
use anchor_lang::AccountsClose;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
#[instruction(
epoch: u64,
order_unstake_ticket_index: u64,
order_unstake_ticket_account_bump: u8,
previous_order_unstake_ticket_management_account_bump: u8,
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
    mut,
    // This will be initialised programmatically if it is needed
    // init,
    // payer = gsol_token_account_authority,
    // space = MARINADE_TICKET_ACCOUNT_SPACE,
    seeds = [state.key().as_ref(), ORDER_UNSTAKE_TICKET_ACCOUNT, &epoch.to_be_bytes(), &order_unstake_ticket_index.to_be_bytes()],
    bump = order_unstake_ticket_account_bump,
    )]
    /// CHECK: Checked in marinade program
    pub order_unstake_ticket_account: UncheckedAccount<'info>,

    #[account(
    init_if_needed,
    space = OrderUnstakeTicketManagementAccount::SPACE,
    payer = payer,
    seeds = [state.key().as_ref(), ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT, &epoch.to_be_bytes()],
    bump
    )]
    pub order_unstake_ticket_management_account:
        Box<Account<'info, OrderUnstakeTicketManagementAccount>>,

    #[account(
    mut,
    // TODO - before closing, we need to be sure all order tickets are closed
    // one way to do this is to decrement the number of open tickets for each one chaimed in this tx
    // and fail out if there are any left
    // This works until we have too many open tickets that it needs more than one tx
    // close = payer,
    seeds = [state.key().as_ref(), ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT, &(epoch - 1).to_be_bytes()],
    bump = previous_order_unstake_ticket_management_account_bump
    )]
    pub previous_order_unstake_ticket_management_account:
        Option<Account<'info, OrderUnstakeTicketManagementAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn trigger_pool_rebalance_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, TriggerPoolRebalance<'info>>,
    epoch: u64,
    index: u64,
    order_unstake_ticket_account_bump: u8,
    _previous_order_unstake_ticket_management_account_bump: u8,
) -> Result<()> {
    // check the ticket info is correct
    require_eq!(ctx.accounts.clock.epoch, epoch);
    require_eq!(
        ctx.accounts.order_unstake_ticket_management_account.tickets + 1,
        index
    );

    let management_account = &mut ctx.accounts.order_unstake_ticket_management_account;
    if management_account.epoch == 0 && management_account.tickets == 0 {
        // set up management account
        management_account.epoch = epoch;
        management_account.tickets = 0;
    } else {
        // check the epoch is correct
        require_eq!(management_account.epoch, epoch);
    }

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

    msg!(
        "Before reload {}",
        ctx.accounts.liq_pool_token_account.amount
    );
    ctx.accounts.liq_pool_token_account.reload()?;
    msg!("Reloaded liq_pool_token_amount to reflect any added liquidity");
    msg!(
        "after reload {}",
        ctx.accounts.liq_pool_token_account.amount
    );

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
            .order_unstake_ticket_management_account
            .add_ticket(
                amounts.amount_to_order_delayed_unstake,
                ctx.accounts.clock.epoch,
            )?;
    }

    // WARNING - this must happen _after_ the order unstake ticket account is created
    // otherwise the transaction fails with "sum of account balances before and after instruction do not match"
    // TODO check here that all tickets for the previous epoch are now closed
    // Close the previous epoch's ticket management account
    // and pass the rent to the tx payer, which compensates them for opening a new one
    msg!("Closing previous epoch's ticket management account");
    ctx.accounts
        .previous_order_unstake_ticket_management_account
        .close(ctx.accounts.payer.to_account_info())?;

    Ok(())
}
