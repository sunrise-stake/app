use crate::state::State;
use crate::utils::marinade;
use crate::utils::seeds::{GSOL_MINT_AUTHORITY, MSOL_ACCOUNT};
use crate::utils::token::burn;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;
use std::ops::Deref;

#[derive(Accounts, Clone)]
#[instruction(lamports: u64)]
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

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn liquid_unstake_handler(ctx: Context<LiquidUnstake>, lamports: u64) -> Result<()> {
    msg!("Checking liq_pool pool balance");
    let calculate_balance_props = ctx.accounts.deref().into();
    let amounts = marinade::calculate_pool_balance_amounts(&calculate_balance_props, lamports)?;

    if amounts.amount_to_withdraw_from_liq_pool.liq_pool_token > 0 {
        marinade::remove_liquidity(
            ctx.accounts,
            amounts.amount_to_withdraw_from_liq_pool.liq_pool_token,
        )?;
    }

    if amounts.amount_to_liquid_unstake > 0 {
        let msol_lamports = marinade::calc_msol_from_lamports(
            ctx.accounts.marinade_state.as_ref(),
            amounts.amount_to_liquid_unstake,
        )?;

        msg!("Unstaking {} msol lamports", msol_lamports);
        let accounts = ctx.accounts.deref().into();
        marinade::unstake(&accounts, msol_lamports)?;
    }

    msg!("Burn GSol");
    burn(
        lamports,
        &ctx.accounts.gsol_mint.to_account_info(),
        &ctx.accounts.gsol_token_account_authority,
        &ctx.accounts.gsol_token_account.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
    )?;

    let state = &mut ctx.accounts.state;
    state.marinade_minted_gsol = state.marinade_minted_gsol.checked_sub(lamports).unwrap();

    Ok(())
}
