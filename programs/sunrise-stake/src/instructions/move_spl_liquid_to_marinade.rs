use crate::marinade::program::MarinadeFinance;
use crate::state::State;
use crate::utils::{marinade, seeds, spl};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program::invoke_signed,
    },
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::ops::Deref;

const SPL_STAKE_POOL_ID: Pubkey =
    anchor_lang::solana_program::pubkey!("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

/// Move SOL from SPL stake pool (liquid reserve) directly to Marinade liquidity pool.
/// This is an admin-only instruction for rebalancing funds between pools.
#[derive(Accounts, Clone)]
pub struct MoveSplLiquidToMarinade<'info> {
    #[account(
        mut,
        has_one = update_authority,
        has_one = marinade_state,
        constraint = state.blaze_state == *stake_pool.key
    )]
    pub state: Box<Account<'info, State>>,

    pub update_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // SPL Stake Pool accounts for withdraw_sol
    #[account(mut)]
    /// CHECK: Validated by constraint on state
    pub stake_pool: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub stake_pool_withdraw_authority: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub reserve_stake_account: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub manager_fee_account: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub stake_pool_token_mint: UncheckedAccount<'info>,

    #[account(mut, token::authority = bsol_account_authority)]
    pub bsol_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [state.key().as_ref(), seeds::BSOL_ACCOUNT],
        bump = state.bsol_authority_bump
    )]
    /// CHECK: PDA authority for bSOL token account
    pub bsol_account_authority: UncheckedAccount<'info>,

    // Marinade accounts for add_liquidity
    /// CHECK: Validated by constraint on state
    #[account(mut)]
    pub marinade_state: UncheckedAccount<'info>,

    #[account(mut)]
    pub liq_pool_mint: Box<Account<'info, Mint>>,
    /// CHECK: Checked in marinade program
    pub liq_pool_mint_authority: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: UncheckedAccount<'info>,
    #[account(mut)]
    pub liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [state.key().as_ref(), seeds::MSOL_ACCOUNT],
        bump = state.msol_authority_bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,

    #[account(
        mut,
        token::mint = liq_pool_mint,
        token::authority = msol_token_account_authority
    )]
    pub liq_pool_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Clock sysvar
    pub sysvar_clock: UncheckedAccount<'info>,
    /// CHECK: Stake history sysvar
    pub sysvar_stake_history: UncheckedAccount<'info>,
    /// CHECK: SPL Stake Pool program - validated in handler
    pub stake_pool_program: UncheckedAccount<'info>,
    /// CHECK: Native stake program
    pub native_stake_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn move_spl_liquid_to_marinade_handler(
    ctx: Context<MoveSplLiquidToMarinade>,
    lamports: u64,
) -> Result<()> {
    require_keys_eq!(*ctx.accounts.stake_pool_program.key, SPL_STAKE_POOL_ID);

    msg!(
        "Moving {} lamports from SPL pool to Marinade liquidity pool",
        lamports
    );

    // Step 1: Withdraw SOL from SPL stake pool to the msol_token_account_authority PDA
    let stake_pool = spl::deserialize_spl_stake_pool(&ctx.accounts.stake_pool)?;
    let pool_tokens = spl::calc_bsol_from_lamports(&stake_pool, lamports)?;

    let bsol_bump = ctx.accounts.state.bsol_authority_bump;
    let state_key = ctx.accounts.state.key();
    let bsol_seeds = [state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bsol_bump]];

    // Build instruction data with discriminator 16 for withdrawSol
    let mut data = vec![16u8];
    data.extend_from_slice(&pool_tokens.to_le_bytes());

    // Build accounts list - withdraw to msol_token_account_authority PDA
    let accounts = vec![
        AccountMeta::new(*ctx.accounts.stake_pool.key, false),
        AccountMeta::new_readonly(*ctx.accounts.stake_pool_withdraw_authority.key, false),
        AccountMeta::new_readonly(*ctx.accounts.bsol_account_authority.key, true),
        AccountMeta::new(ctx.accounts.bsol_token_account.key(), false),
        AccountMeta::new(*ctx.accounts.reserve_stake_account.key, false),
        AccountMeta::new(ctx.accounts.msol_token_account_authority.key(), false), // withdraw to PDA
        AccountMeta::new(*ctx.accounts.manager_fee_account.key, false),
        AccountMeta::new(*ctx.accounts.stake_pool_token_mint.key, false),
        AccountMeta::new_readonly(*ctx.accounts.sysvar_clock.key, false),
        AccountMeta::new_readonly(*ctx.accounts.sysvar_stake_history.key, false),
        AccountMeta::new_readonly(*ctx.accounts.native_stake_program.key, false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        AccountMeta::new_readonly(*ctx.accounts.bsol_account_authority.key, true),
    ];

    let instruction = Instruction {
        program_id: SPL_STAKE_POOL_ID,
        accounts,
        data,
    };

    msg!(
        "Withdrawing {} bSOL ({} lamports) from SPL pool",
        pool_tokens,
        lamports
    );
    invoke_signed(
        &instruction,
        &[
            ctx.accounts.stake_pool.to_account_info(),
            ctx.accounts.stake_pool_withdraw_authority.to_account_info(),
            ctx.accounts.bsol_account_authority.to_account_info(),
            ctx.accounts.bsol_token_account.to_account_info(),
            ctx.accounts.reserve_stake_account.to_account_info(),
            ctx.accounts.msol_token_account_authority.to_account_info(),
            ctx.accounts.manager_fee_account.to_account_info(),
            ctx.accounts.stake_pool_token_mint.to_account_info(),
            ctx.accounts.sysvar_clock.to_account_info(),
            ctx.accounts.sysvar_stake_history.to_account_info(),
            ctx.accounts.native_stake_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        &[&bsol_seeds],
    )?;

    // Step 2: Add SOL to Marinade liquidity pool
    msg!("Adding {} lamports to Marinade liquidity pool", lamports);
    let add_liquidity_props = ctx.accounts.deref().into();
    marinade::add_liquidity_from_pda(&add_liquidity_props, lamports)?;

    // Step 3: Update accounting
    // Cap at available blaze_minted_gsol to avoid underflow (yield appreciation
    // means actual SOL value can exceed the tracked accounting amount)
    let state = &mut ctx.accounts.state;
    let accounting_adjustment = std::cmp::min(lamports, state.blaze_minted_gsol);
    state.blaze_minted_gsol = state
        .blaze_minted_gsol
        .checked_sub(accounting_adjustment)
        .unwrap();
    state.marinade_minted_gsol = state
        .marinade_minted_gsol
        .checked_add(accounting_adjustment)
        .unwrap();

    msg!(
        "Rebalance complete. blaze_minted_gsol: {}, marinade_minted_gsol: {}",
        state.blaze_minted_gsol,
        state.marinade_minted_gsol
    );

    Ok(())
}
