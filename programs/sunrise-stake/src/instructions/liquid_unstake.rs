use crate::marinade::program::MarinadeFinance;
use crate::state::State;
use crate::utils::seeds::{BSOL_ACCOUNT, GSOL_MINT_AUTHORITY, MSOL_ACCOUNT};
use crate::utils::token::burn;
use crate::utils::{marinade, spl};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::ops::Deref;

#[derive(Accounts, Clone)]
#[instruction(lamports: u64)]
pub struct LiquidUnstake<'info> {
    #[account(
    has_one = marinade_state,
    has_one = gsol_mint,
    )]
    pub state: Box<Account<'info, State>>,

    /// CHECK: Validated in handler
    #[account(mut)]
    pub marinade_state: UncheckedAccount<'info>,

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
    pub liq_pool_sol_leg_pda: UncheckedAccount<'info>,

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
    token::mint = gsol_mint,
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

    ///////////////////////////////////////////////////////
    ///  Blaze Stake Accounts
    /// //////////////////////////////////////////////////
    #[account(mut, token::authority = bsol_account_authority)]
    pub bsol_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [state.key().as_ref(), BSOL_ACCOUNT],
        bump = state.bsol_authority_bump
    )]
    /// CHECK:
    pub bsol_account_authority: AccountInfo<'info>,
    #[account(mut, constraint = state.blaze_state == *blaze_stake_pool.key)]
    /// CHECK:
    pub blaze_stake_pool: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_withdraw_authority: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub reserve_stake_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub manager_fee_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub bsol_mint: AccountInfo<'info>,
    /// CHECK:
    pub sysvar_stake_history: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_program: AccountInfo<'info>,
    /// CHECK:
    pub native_stake_program: AccountInfo<'info>,
    /// CHECK:
    pub clock: Sysvar<'info, Clock>,
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

    let marinade_state = marinade::deserialize_marinade_state(&ctx.accounts.marinade_state)?;
    let msol_account_valuation = marinade::calc_lamports_from_msol_amount(
        &marinade_state,
        ctx.accounts.get_msol_from.amount,
    )?;
    msg!("msol account valuation: {}", msol_account_valuation);

    let blaze_pool = spl::deserialize_spl_stake_pool(&ctx.accounts.blaze_stake_pool)?;
    let bsol_account_valuation =
        spl::calc_lamports_from_bsol_amount(&blaze_pool, ctx.accounts.bsol_token_account.amount)?;
    msg!("bsol account valuation: {}", bsol_account_valuation);

    let liquid_unstake_amount = amounts.amount_to_liquid_unstake;
    msg!("amount to liquid unstake: {}", liquid_unstake_amount);

    msg!("Burn GSol");
    burn(
        lamports,
        &ctx.accounts.gsol_mint.to_account_info(),
        &ctx.accounts.gsol_token_account_authority,
        &ctx.accounts.gsol_token_account.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
    )?;

    if liquid_unstake_amount == 0 {
        // All SOL came from LP removal (Marinade-side), update accounting.
        // saturating_sub: these fields are bookkeeping only and do not control
        // SOL disbursement (that is governed by actual token balances and pool
        // exchange rates). Yield appreciation can cause the tracked value to
        // drift below the real amount, so we clamp to zero rather than panic,
        // which would block users from unstaking.
        let state = &mut ctx.accounts.state;
        state.marinade_minted_gsol = state.marinade_minted_gsol.saturating_sub(lamports);
        return Ok(());
    }

    let (marinade_withdraw_amount, blaze_withdraw_amount) =
        if msol_account_valuation >= bsol_account_valuation {
            match msol_account_valuation >= liquid_unstake_amount {
                true => (liquid_unstake_amount, 0),
                false => {
                    let diff = liquid_unstake_amount
                        .checked_sub(msol_account_valuation)
                        .unwrap();
                    (liquid_unstake_amount.checked_sub(diff).unwrap(), diff)
                }
            }
        } else {
            match bsol_account_valuation >= liquid_unstake_amount {
                true => (0, liquid_unstake_amount),
                false => {
                    let diff = liquid_unstake_amount
                        .checked_sub(bsol_account_valuation)
                        .unwrap();
                    (diff, liquid_unstake_amount.checked_sub(diff).unwrap())
                }
            }
        };

    msg!("user demanded unstake: {}", lamports);
    msg!(
        "(marinade withdrawal, blaze withdrawal) => ({}, {})",
        marinade_withdraw_amount,
        blaze_withdraw_amount
    );

    if marinade_withdraw_amount > 0 {
        let msol_value =
            marinade::calc_msol_from_lamports(&marinade_state, marinade_withdraw_amount)?;

        msg!(
            "Unstaking {} lamports({} msol) from marinade",
            marinade_withdraw_amount,
            msol_value
        );
        let accounts = ctx.accounts.deref().into();
        marinade::unstake(&accounts, msol_value)?;
    }

    if blaze_withdraw_amount > 0 {
        let bsol_value = spl::calc_bsol_from_lamports(&blaze_pool, blaze_withdraw_amount)?;
        msg!(
            "Unstaking {} lamports({} bsol) from blaze",
            blaze_withdraw_amount,
            bsol_value
        );
        let mut accounts = crate::SplWithdrawSol {
            state: ctx.accounts.state.clone(),
            gsol_mint: ctx.accounts.gsol_mint.clone(),
            user: ctx.accounts.gsol_token_account_authority.clone(),
            user_gsol_token_account: *ctx.accounts.gsol_token_account.clone(),
            bsol_token_account: ctx.accounts.bsol_token_account.clone(),
            bsol_account_authority: ctx.accounts.bsol_account_authority.clone(),
            stake_pool: ctx.accounts.blaze_stake_pool.clone(),
            stake_pool_withdraw_authority: ctx.accounts.stake_pool_withdraw_authority.clone(),
            reserve_stake_account: ctx.accounts.reserve_stake_account.clone(),
            manager_fee_account: ctx.accounts.manager_fee_account.clone(),
            stake_pool_token_mint: ctx.accounts.bsol_mint.clone(),
            sysvar_clock: ctx.accounts.clock.to_account_info(),
            sysvar_stake_history: ctx.accounts.sysvar_stake_history.clone(),
            stake_pool_program: ctx.accounts.stake_pool_program.clone(),
            native_stake_program: ctx.accounts.native_stake_program.clone(),
            token_program: ctx.accounts.token_program.clone(),
        };
        accounts.withdraw_sol(blaze_withdraw_amount)?;
    }

    // Update accounting: marinade portion is everything not withdrawn from blaze.
    // (blaze_minted_gsol is already decremented inside withdraw_sol.)
    // saturating_sub: see comment above — bookkeeping only, must not block users.
    let state = &mut ctx.accounts.state;
    let marinade_portion = lamports.saturating_sub(blaze_withdraw_amount);
    state.marinade_minted_gsol = state.marinade_minted_gsol.saturating_sub(marinade_portion);

    Ok(())
}
