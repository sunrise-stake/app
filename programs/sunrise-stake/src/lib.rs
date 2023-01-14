#![allow(clippy::result_large_err)]
mod utils;

use crate::utils::seeds::*;
use crate::utils::token::{create_mint, mint_to};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::{State as MarinadeState, TicketAccountData as MarinadeTicketAccount};

declare_id!("gStMmPPFUGhmyQE8r895q28JVW9JkvDepNu2hTg1f4p");

#[program]
pub mod sunrise_stake {
    use super::*;
    use crate::utils::{marinade, marinade::{
        amount_to_be_deposited_in_liq_pool, calc_lamports_from_msol_amount,
        calc_msol_from_lamports, recoverable_yield, calculate_pool_balance_amounts
    }, system, token::{burn, create_token_account}};
    use anchor_lang::solana_program::program::invoke_signed;
    use anchor_lang::solana_program::system_instruction::transfer;
    use std::ops::Deref;
    use marinade_cpi::TicketAccountData;
    use crate::utils::marinade::ClaimUnstakeTicketProperties;

    pub fn deposit(ctx: Context<Deposit>, lamports: u64) -> Result<()> {
        msg!("Checking liq_pool pool balance");
        let to_deposit_in_liq_pool = amount_to_be_deposited_in_liq_pool(ctx.accounts, lamports)?;
        let to_stake = lamports - to_deposit_in_liq_pool;

        if to_deposit_in_liq_pool > 0 {
            msg!("Depositing {} in liq_pool pool", to_deposit_in_liq_pool);
            let accounts = ctx.accounts.deref().into();
            marinade::add_liquidity(&accounts, to_deposit_in_liq_pool)?;
        }

        if to_stake > 0 {
            msg!("Staking {}", to_stake);
            marinade::deposit(ctx.accounts, to_stake)?;
        }

        msg!("Mint {} GSOL", lamports);
        mint_to(
            lamports,
            &ctx.accounts.gsol_mint.to_account_info(),
            &ctx.accounts.gsol_mint_authority.to_account_info(),
            &ctx.accounts.mint_gsol_to.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            &ctx.accounts.state,
        )
    }

    pub fn order_unstake(ctx: Context<OrderUnstake>, lamports: u64) -> Result<()> {
        let msol_lamports =
            calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), lamports)?;

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
            &ctx.accounts.gsol_token_account_authority,
            &ctx.accounts.gsol_token_account.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
        )?;

        Ok(())
    }

    pub fn claim_unstake_ticket(ctx: Context<ClaimUnstakeTicket>) -> Result<()> {
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

    // TODO move the parameters relating to the order unstake ticket into a struct
    pub fn liquid_unstake(ctx: Context<LiquidUnstake>, lamports: u64, epoch: u64, index: u64, order_unstake_ticket_account_bump: u8) -> Result<()> {
        // check the ticket info is correct
        require_eq!(ctx.accounts.clock.epoch, epoch);
        require_eq!(ctx.accounts.order_unstake_ticket_management_account.tickets + 1, index);

        msg!("Checking liq_pool pool balance");
        let calculate_balance_props = ctx.accounts.deref().into();
        let amounts = calculate_pool_balance_amounts(&calculate_balance_props, lamports)?;

        if amounts.amount_to_withdraw_from_liq_pool.liq_pool_token > 0 {
            marinade::remove_liquidity(ctx.accounts, amounts.amount_to_withdraw_from_liq_pool.liq_pool_token)?;
        }

        if amounts.amount_to_liquid_unstake > 0 {
            let msol_lamports =
                calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), amounts.amount_to_liquid_unstake)?;

            msg!("Unstaking {} msol lamports", msol_lamports);
            let accounts = ctx.accounts.deref().into();
            marinade::unstake(&accounts, msol_lamports)?;
        }

        if amounts.amount_to_order_delayed_unstake > 0 {
            let msol_lamports =
                calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), amounts.amount_to_order_delayed_unstake)?;

            msg!("Creating order unstake ticket account");
            let create_ticket_props = ctx.accounts.deref().into();
            system::create_order_unstake_ticket_account(
                &create_ticket_props,
                order_unstake_ticket_account_bump,
                index)?;



            msg!("Ordering a delayed unstake of {} msol lamports", msol_lamports);
            let order_unstake_props = ctx.accounts.deref().into();
            marinade::order_unstake(&order_unstake_props, msol_lamports)?;

            // updating the internal record of delayed unstakes ordered.
            ctx.accounts.order_unstake_ticket_management_account.add_ticket(
                amounts.amount_to_order_delayed_unstake,
                ctx.accounts.clock.epoch
            )?;
        }

        msg!("Burn GSol");
        burn(
            lamports,
            &ctx.accounts.gsol_mint.to_account_info(),
            &ctx.accounts.gsol_token_account_authority,
            &ctx.accounts.gsol_token_account.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
        )?;

        Ok(())
    }

    pub fn trigger_pool_rebalance<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, TriggerPoolRebalance<'info>>,
        epoch: u64,
        index: u64,
        order_unstake_ticket_account_bump: u8,
        previous_order_unstake_ticket_management_account_bump: u8,
        pre_pool_account_bump: u8
    ) -> Result<()> {
        // check the ticket info is correct
        require_eq!(ctx.accounts.clock.epoch, epoch);
        require_eq!(ctx.accounts.order_unstake_ticket_management_account.tickets + 1, index);

        msg!("Checking liq_pool pool balance");
        let calculate_pool_balance_props = ctx.accounts.deref().into();
        let amounts = calculate_pool_balance_amounts(&calculate_pool_balance_props, 0)?;

        if amounts.amount_to_order_delayed_unstake > 0 {
            let msol_lamports =
                calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), amounts.amount_to_order_delayed_unstake)?;

            // TODO move to just using init
            msg!("Creating order unstake ticket account");
            let create_ticket_props = ctx.accounts.deref().into();
            system::create_order_unstake_ticket_account(
                &create_ticket_props,
                order_unstake_ticket_account_bump,
                index)?;


            msg!("Ordering a delayed unstake of {} msol lamports", msol_lamports);
            let order_unstake_props = ctx.accounts.deref().into();
            marinade::order_unstake(&order_unstake_props, msol_lamports)?;

            // updating the internal record of delayed unstakes ordered.
            ctx.accounts.order_unstake_ticket_management_account.add_ticket(
                amounts.amount_to_order_delayed_unstake,
                ctx.accounts.clock.epoch
            )?;
        }

        let mut claimed_lamports = 0;
        // All remaining accounts are previous epoch tickets that are now ready to be claimed.
        for ticket in ctx.remaining_accounts.iter() {
            let mut props: ClaimUnstakeTicketProperties = ctx.accounts.deref().into();
            props.ticket_account = ticket.to_account_info();

            marinade::claim_unstake_ticket(&props)?;

            let ticket_account = TicketAccountData::try_from_slice(&ticket.data.borrow())?;
            claimed_lamports += ticket_account.lamports_amount;
        }

        let add_liquidity_props = ctx.accounts.deref().into();
        marinade::add_liquidity(&add_liquidity_props, claimed_lamports)?;

        Ok(())
    }

    pub fn withdraw_to_treasury(ctx: Context<WithdrawToTreasury>) -> Result<()> {
        // TODO at present, this withdraws all msol yield. In future, we should be able to choose how much to withdraw
        let recoverable_yield_msol = recoverable_yield(
            &ctx.accounts.marinade_state,
            &ctx.accounts.get_msol_from,
            &ctx.accounts.gsol_mint,
        )?;

        // TODO later change to use "slow unstake" rather than incur liq pool fees

        msg!("Withdrawing {} msol to treasury", recoverable_yield_msol);
        let accounts = ctx.accounts.deref().into();
        marinade::unstake(&accounts, recoverable_yield_msol)?;

        Ok(())
    }

    ////////////////////////////
    // ADMIN FUNCTIONS
    ////////////////////////////
    pub fn register_state(ctx: Context<RegisterState>, state: RegisterStateInput) -> Result<()> {
        let state_account = &mut ctx.accounts.state;
        state_account.marinade_state = state.marinade_state;
        state_account.update_authority = state.update_authority;
        state_account.gsol_mint_authority_bump = state.gsol_mint_authority_bump;
        state_account.msol_authority_bump = state.msol_authority_bump;
        state_account.treasury = state.treasury;
        state_account.gsol_mint = ctx.accounts.mint.key();
        state_account.liq_pool_proportion = state.liq_pool_proportion;
        state_account.liq_pool_min_proportion = state.liq_pool_min_proportion;

        // create the gsol mint
        let gsol_mint_authority = Pubkey::create_program_address(
            &[
                &state_account.key().to_bytes(),
                GSOL_MINT_AUTHORITY,
                &[state_account.gsol_mint_authority_bump],
            ],
            ctx.program_id,
        )
        .unwrap();
        create_mint(
            &ctx.accounts.payer,
            &ctx.accounts.mint.to_account_info(),
            &gsol_mint_authority,
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.rent.to_account_info(),
        )?;

        // create msol token account
        // Note - the relationship between msol_mint and marinade_state is not verified here
        // Specifically, the marinade_state is not passed into the register function as an account.
        // This simplifies the registration code, but if it is registered incorrectly, deposits will fail.
        create_token_account(
            &ctx.accounts.payer,
            &ctx.accounts.msol_token_account,
            &ctx.accounts.msol_mint,
            &ctx.accounts.msol_token_account_authority,
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.associated_token_program,
            &ctx.accounts.rent,
        )?;

        // create marinade msol/sol liquditiy pool token account
        // the same token account authority PDA is used for the
        // msol token account and the liquidity pool token account
        create_token_account(
            &ctx.accounts.payer,
            &ctx.accounts.liq_pool_token_account,
            &ctx.accounts.liq_pool_mint,
            &ctx.accounts.msol_token_account_authority,
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.associated_token_program,
            &ctx.accounts.rent,
        )?;

        Ok(())
    }

    pub fn update_state(ctx: Context<UpdateState>, state: UpdateStateInput) -> Result<()> {
        // Check the liq_pool_proportion does not exceed 100%
        require_gte!(100, state.liq_pool_proportion);

        let state_account = &mut ctx.accounts.state;
        state_account.update_authority = state.update_authority;
        state_account.treasury = state.treasury;
        state_account.liq_pool_proportion = state.liq_pool_proportion;
        state_account.liq_pool_min_proportion = state.liq_pool_min_proportion;

        Ok(())
    }

    // TODO this is only used during development, to add features to the state account
    // without having to create a new one.
    // Once it is stable, we should remove this function.
    pub fn resize_state(_ctx: Context<ResizeState>, _size: u64) -> Result<()> {
        Ok(())
    }
}

#[account]
pub struct State {
    pub marinade_state: Pubkey,
    pub update_authority: Pubkey,
    pub gsol_mint: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
    pub msol_authority_bump: u8,
    /// 0-100 - The proportion of the total staked SOL that should be in the
    /// liquidity pool.
    pub liq_pool_proportion: u8,
    /// 0-100 - If unstaking would result in the proportion of SOL in the
    /// liquidity pool dropping below this value, trigger an delayed unstake
    /// for the difference
    pub liq_pool_min_proportion: u8,
}
impl State {
    const SPACE: usize = 32 + 32 + 32 + 32 + 1 + 1 + 1 + 1 + 8 /* DISCRIMINATOR */ ;
}

/// Maps a marinade ticket account to a GSOL token holder
#[account]
pub struct SunriseTicketAccount {
    pub state_address: Pubkey, // instance of sunrise state this ticket belongs to
    pub marinade_ticket_account: Pubkey,
    pub beneficiary: Pubkey,
}
impl SunriseTicketAccount {
    const SPACE: usize = 32 + 32 + 32 + 8 /* DISCRIMINATOR */ ;
}

#[account]
pub struct OrderUnstakeTicketManagementAccount {
    pub state_address: Pubkey,
    pub epoch: u64,
    pub tickets: u64,
    pub total_ordered_lamports: u64,
}
impl OrderUnstakeTicketManagementAccount {
    const SPACE: usize = 32 + 8 + 8 + 8 + 8 /* DISCRIMINATOR */ ;

    pub fn add_ticket(&mut self, ticket_amount_lamports: u64, epoch: u64) -> Result<()> {
        if self.epoch == 0 {
            self.epoch = epoch;
        } else {
            require_eq!(self.epoch, epoch, ErrorCode::InvalidOrderUnstakeManagementAccount);
        }
        self.tickets += 1;
        self.total_ordered_lamports += ticket_amount_lamports;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RegisterStateInput {
    pub marinade_state: Pubkey,
    pub update_authority: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
    pub msol_authority_bump: u8,
    pub liq_pool_proportion: u8,
    pub liq_pool_min_proportion: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateStateInput {
    pub update_authority: Pubkey,
    pub treasury: Pubkey,
    pub liq_pool_proportion: u8,
    pub liq_pool_min_proportion: u8,
}

#[derive(Accounts)]
#[instruction(state_in: RegisterStateInput)]
pub struct RegisterState<'info> {
    #[account(init, space = State::SPACE, payer = payer)]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

    #[account()]
    pub msol_mint: Box<Account<'info, Mint>>,

    /// Must be a PDA, but otherwise owned by the system account ie not initialised with data
    #[account(
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state_in.msol_authority_bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,

    #[account(mut)]
    pub msol_token_account: SystemAccount<'info>,

    #[account()]
    pub liq_pool_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub liq_pool_token_account: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(state_in: UpdateStateInput)]
pub struct UpdateState<'info> {
    #[account(
        mut,
        has_one = update_authority
    )]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub update_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(size: usize)]
pub struct ResizeState<'info> {
    #[account(
    mut,
    has_one = update_authority,
    realloc = size,
    realloc::payer = payer,
    realloc::zero = false,
    )]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub update_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Clone)]
pub struct Deposit<'info> {
    #[account(
    has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account()]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(
    mut,
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
    pub gsol_mint_authority: SystemAccount<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub liq_pool_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    #[account(mut)]
    pub liq_pool_msol_leg: Account<'info, TokenAccount>,
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg_authority: AccountInfo<'info>,

    /// CHECK: Checked in marinade program
    pub liq_pool_mint_authority: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub reserve_pda: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub transfer_from: Signer<'info>,

    #[account(
    mut,
    token::mint = msol_mint,
    token::authority = msol_token_account_authority,
    )]
    pub mint_msol_to: Account<'info, TokenAccount>,

    #[account(
    mut,
    token::mint = liq_pool_mint,
    token::authority = msol_token_account_authority,
    )]
    pub mint_liq_pool_to: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    token::mint = gsol_mint,
    token::authority = transfer_from.key(),
    )]
    pub mint_gsol_to: Account<'info, TokenAccount>,

    /// CHECK: Checked in marinade program
    pub msol_mint_authority: AccountInfo<'info>,

    #[account(
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state.msol_authority_bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[derive(Accounts, Clone)]
#[instruction(
    lamports: u64,
    epoch: u64,
    order_unstake_ticket_index: u64,
    order_unstake_ticket_account_bump: u8
)]
pub struct LiquidUnstake<'info> {
    #[account(
    has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub liq_pool_mint: Box<Account<'info, Mint>>,

    #[account(
    mut,
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
    pub get_liq_pool_token_from: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    token::authority = gsol_token_account_authority
    )]
    pub gsol_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Owner of the gsol token account
    pub gsol_token_account_authority: Signer<'info>,

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
        // init_if_needed,
        // This will be initialised programmatically if it is needed
        // space = OrderUnstakeTicketManagementAccount::SPACE,
        // payer = gsol_token_account_authority,
        seeds = [state.key().as_ref(), ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT, &epoch.to_be_bytes()],
        bump
    )]
    pub order_unstake_ticket_management_account: Box<Account<'info, OrderUnstakeTicketManagementAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[derive(Accounts, Clone)]
#[instruction(
lamports: u64,
epoch: u64,
order_unstake_ticket_index: u64,
order_unstake_ticket_account_bump: u8,
previous_order_unstake_ticket_management_account_bump: u8,
pre_pool_account_bump: u8
)]
pub struct TriggerPoolRebalance<'info> {
    #[account(
    has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    #[account(
    mut,
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
    seeds = [state.key().as_ref(), PRE_POOL_ACCOUNT],
    bump = pre_pool_account_bump,
    )]
    pub pre_pool_account: SystemAccount<'info>,

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
    // init,
    // This will be initialised programmatically if it is needed
    // space = OrderUnstakeTicketManagementAccount::SPACE,
    // payer = gsol_token_account_authority,
    seeds = [state.key().as_ref(), ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT, &epoch.to_be_bytes()],
    bump
    )]
    pub order_unstake_ticket_management_account: Box<Account<'info, OrderUnstakeTicketManagementAccount>>,

    #[account(
    seeds = [state.key().as_ref(), ORDER_UNSTAKE_TICKET_MANAGEMENT_ACCOUNT, &(epoch - 1).to_be_bytes()],
    bump = previous_order_unstake_ticket_management_account_bump
    )]
    pub previous_order_unstake_ticket_management_account: Box<Account<'info, OrderUnstakeTicketManagementAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

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
    pub treasury: SystemAccount<'info>, // sunrise-stake treasury

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Clone)]
pub struct ClaimUnstakeTicket<'info> {
    #[account(
    has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,
    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,
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

#[derive(Accounts, Clone)]
pub struct WithdrawToTreasury<'info> {
    #[account(
    has_one = treasury,
    has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(mut)]
    pub msol_mint: Account<'info, Mint>,

    #[account()]
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg: Account<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub treasury_msol_account: AccountInfo<'info>,

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

    #[account(mut)]
    /// CHECK: Matches state.treasury
    pub treasury: SystemAccount<'info>, // sunrise-stake treasury

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("An error occurred when calculating an MSol value")]
    CalculationFailure,
    #[msg("The order unstake management account is invalid for this epoch")]
    InvalidOrderUnstakeManagementAccount,
}
