use crate::marinade::program::MarinadeFinance;
use crate::state::State;
use crate::utils::{marinade, seeds};
use crate::ErrorCode;
use anchor_lang::{
    prelude::*,
    solana_program::{
        borsh1,
        program::invoke_signed,
        stake::{self, state::StakeStateV2},
    },
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::ops::Deref;

/// Deposit a deactivated stake account (from SPL rebalancing) into Marinade liquidity pool.
/// This is an admin-only instruction for rebalancing funds between pools.
/// The stake account must be fully deactivated before this can be called.
#[derive(Accounts, Clone)]
#[instruction(index: u64)]
pub struct DepositSplStakeToLiquid<'info> {
    #[account(
        mut,
        has_one = update_authority,
        has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    pub update_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// The stake account to withdraw from - must be fully deactivated
    #[account(
        mut,
        seeds = [state.key().as_ref(), seeds::SPL_REBALANCE_STAKE_ACCOUNT, &index.to_be_bytes()],
        bump
    )]
    /// CHECK: Verified to be a deactivated stake account in handler
    pub stake_account: UncheckedAccount<'info>,

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
    /// CHECK: Native stake program
    pub native_stake_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn deposit_spl_stake_to_liquid_handler(
    ctx: Context<DepositSplStakeToLiquid>,
    index: u64,
) -> Result<()> {
    msg!(
        "Depositing stake account {} to Marinade liquidity pool",
        index
    );

    // Step 1: Verify stake account is fully deactivated
    let stake_data = ctx.accounts.stake_account.try_borrow_data()?;
    let stake_state = borsh1::try_from_slice_unchecked::<StakeStateV2>(&stake_data)?;

    let lamports = match stake_state {
        StakeStateV2::Initialized(_) => {
            // Stake was never activated, just get the lamports
            ctx.accounts.stake_account.lamports()
        }
        StakeStateV2::Stake(_, stake, _) => {
            // Verify it's fully deactivated (deactivation_epoch is in the past)
            let clock = Clock::get()?;
            require!(
                stake.delegation.deactivation_epoch < clock.epoch,
                ErrorCode::StakeAccountNotFullyDeactivated
            );
            ctx.accounts.stake_account.lamports()
        }
        _ => return Err(ErrorCode::InvalidStakeAccountState.into()),
    };

    // Need to drop the borrow before we can use the account
    drop(stake_data);

    let state_key = ctx.accounts.state.key();
    let msol_bump = ctx.accounts.state.msol_authority_bump;
    let msol_seeds = [state_key.as_ref(), seeds::MSOL_ACCOUNT, &[msol_bump]];

    // Step 2: Withdraw all lamports from stake account to msol_token_account_authority PDA
    msg!("Withdrawing {} lamports from stake account", lamports);

    let withdraw_ix = stake::instruction::withdraw(
        &ctx.accounts.stake_account.key(),
        &ctx.accounts.msol_token_account_authority.key(),
        &ctx.accounts.msol_token_account_authority.key(),
        lamports,
        None,
    );

    invoke_signed(
        &withdraw_ix,
        &[
            ctx.accounts.stake_account.to_account_info(),
            ctx.accounts.msol_token_account_authority.to_account_info(),
            ctx.accounts.sysvar_clock.to_account_info(),
            ctx.accounts.sysvar_stake_history.to_account_info(),
            ctx.accounts.msol_token_account_authority.to_account_info(), // withdraw authority
        ],
        &[&msol_seeds],
    )?;

    // Step 3: Add SOL to Marinade liquidity pool
    msg!("Adding {} lamports to Marinade liquidity pool", lamports);
    let add_liquidity_props = ctx.accounts.deref().into();
    marinade::add_liquidity_from_pda(&add_liquidity_props, lamports)?;

    // Step 4: Update accounting
    let state = &mut ctx.accounts.state;
    state.marinade_minted_gsol = state.marinade_minted_gsol.checked_add(lamports).unwrap();

    msg!(
        "Deposit complete. marinade_minted_gsol: {}",
        state.marinade_minted_gsol
    );

    Ok(())
}
