use crate::state::State;
use crate::utils::seeds::{GSOL_MINT_AUTHORITY, MSOL_ACCOUNT};
use crate::utils::token::mint_to;
use crate::utils::{marinade, marinade::amount_to_be_deposited_in_liq_pool};
use crate::marinade::program::MarinadeFinance;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::ops::Deref;

#[derive(Accounts, Clone)]
pub struct Deposit<'info> {
    #[account(mut,has_one = marinade_state)]
    pub state: Box<Account<'info, State>>,

    /// CHECK: Validated in handler
    #[account(mut)]
    pub marinade_state: UncheckedAccount<'info>,

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
    pub liq_pool_sol_leg_pda: UncheckedAccount<'info>,

    #[account(mut)]
    pub liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg_authority: UncheckedAccount<'info>,

    /// CHECK: Checked in marinade program
    pub liq_pool_mint_authority: UncheckedAccount<'info>,

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

pub fn deposit_handler(ctx: Context<Deposit>, lamports: u64) -> Result<()> {
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
    )?;
    let state = &mut ctx.accounts.state;
    state.marinade_minted_gsol = state.marinade_minted_gsol.checked_add(lamports).unwrap();
    Ok(())
}
