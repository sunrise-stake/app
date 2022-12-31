#![allow(clippy::result_large_err)]
mod utils;

use crate::utils::seeds::*;
use crate::utils::token::{create_mint, mint_to};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;

declare_id!("gStMmPPFUGhmyQE8r895q28JVW9JkvDepNu2hTg1f4p");

#[program]
pub mod sunrise_stake {
    use super::*;
    use crate::utils::marinade;
    use crate::utils::marinade::{
        calc_lamports_from_msol_amount, calc_msol_from_lamports, recoverable_yield,
    };
    use crate::utils::token::{burn, create_msol_token_account};
    use std::ops::Deref;

    pub fn register_state(ctx: Context<RegisterState>, state: StateInput) -> Result<()> {
        let state_account = &mut ctx.accounts.state;
        state_account.marinade_state = state.marinade_state;
        state_account.update_authority = state.update_authority;
        state_account.gsol_mint = state.gsol_mint;
        state_account.gsol_mint_authority_bump = state.gsol_mint_authority_bump;
        state_account.msol_authority_bump = state.msol_authority_bump;
        state_account.treasury = state.treasury;

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
        create_msol_token_account(
            &ctx.accounts.payer,
            &ctx.accounts.msol_token_account,
            &ctx.accounts.msol_mint,
            &ctx.accounts.msol_token_account_authority,
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.associated_token_program,
            &ctx.accounts.rent,
        )?;

        Ok(())
    }

    // pub fn update_state(ctx: Context<UpdateState>, state: StateInput) -> Result<()> {
    //     let state_account = &mut ctx.accounts.state;
    //     state_account.marinade_state = state.marinade_state;
    //     state_account.update_authority = state.update_authority;
    //     state_account.gsol_mint = state.gsol_mint;
    //     state_account.gsol_mint_authority_bump = state.gsol_mint_authority_bump;
    //     state_account.msol_authority_bump = state.msol_authority_bump;
    //     state_account.treasury = state.treasury;
    //
    //     // create the gsol mint
    //     let gsol_mint_authority = Pubkey::create_program_address(
    //         &[
    //             &state_account.key().to_bytes(),
    //             GSOL_MINT_AUTHORITY,
    //             &[state_account.gsol_mint_authority_bump],
    //         ],
    //         ctx.program_id,
    //     )
    //         .unwrap();
    //     create_mint(
    //         &ctx.accounts.payer,
    //         &ctx.accounts.mint.to_account_info(),
    //         &gsol_mint_authority,
    //         &ctx.accounts.system_program,
    //         &ctx.accounts.token_program,
    //         &ctx.accounts.rent.to_account_info(),
    //     )?;
    //
    //     // create msol token account
    //     create_msol_token_account(
    //         &ctx.accounts.payer,
    //         &ctx.accounts.msol_token_account,
    //         &ctx.accounts.msol_mint,
    //         &ctx.accounts.msol_token_account_authority,
    //         &ctx.accounts.system_program,
    //         &ctx.accounts.token_program,
    //         &ctx.accounts.associated_token_program,
    //         &ctx.accounts.rent,
    //     )?;
    //
    //     Ok(())
    // }

    pub fn deposit(ctx: Context<Deposit>, lamports: u64) -> Result<()> {
        msg!("Depositing");
        marinade::deposit(ctx.accounts, lamports)?;

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

        Ok(())
    }

    pub fn liquid_unstake(ctx: Context<LiquidUnstake>, lamports: u64) -> Result<()> {
        let msol_lamports =
            calc_msol_from_lamports(ctx.accounts.marinade_state.as_ref(), lamports)?;

        msg!("Unstaking");
        let accounts = ctx.accounts.deref().into();
        marinade::unstake(&accounts, msol_lamports)?;

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
}

#[account]
pub struct State {
    pub marinade_state: Pubkey,
    pub update_authority: Pubkey,
    pub gsol_mint: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
    pub msol_authority_bump: u8,
}
impl State {
    const SPACE: usize = 32 + 32 + 32 + 32 + 1 + 1 + 8 /* DISCRIMINATOR */ ;
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

// Matches State above. Used as the input to RegisterState.
// Redefined so that it shows up in the anchor IDL. TODO - is there a better way?
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct StateInput {
    pub marinade_state: Pubkey,
    pub update_authority: Pubkey,
    pub gsol_mint: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
    pub msol_authority_bump: u8,
}

#[derive(Accounts)]
#[instruction(state_in: StateInput)]
pub struct RegisterState<'info> {
    #[account(init, space = State::SPACE, payer = payer)]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    /// Must be a PDA, but otherwise owned by the system account ie not initialised with data
    #[account(
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state_in.msol_authority_bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,

    /// CHECK: Checked by the AssociatedTokenAccount program
    #[account(mut)]
    pub msol_token_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
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
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    #[account(mut)]
    pub liq_pool_msol_leg: Account<'info, TokenAccount>,
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg_authority: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub reserve_pda: AccountInfo<'info>,

    #[account(mut, signer)]
    /// CHECK: Checked in marinade program
    pub transfer_from: AccountInfo<'info>,

    #[account(
    mut,
    token::mint = msol_mint,
    token::authority = msol_token_account_authority,
    )]
    pub mint_msol_to: Account<'info, TokenAccount>,

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
pub struct LiquidUnstake<'info> {
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

    #[account(
    mut,
    token::authority = gsol_token_account_authority
    )]
    pub gsol_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: Owner of the gsol token account
    pub gsol_token_account_authority: UncheckedAccount<'info>,

    #[account()]
    /// CHECK: Matches state.treasury
    pub treasury: SystemAccount<'info>, // sunrise-stake treasury

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
    /// CHECK: Checked in marinade program
    pub marinade_ticket_account: UncheckedAccount<'info>,

    #[account(mut, close = transfer_sol_to)]
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
}
