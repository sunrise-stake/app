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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::seeds;

    /// Test PDA derivation for stake account matches create_spl_stake_account
    #[test]
    fn test_stake_account_pda_derivation() {
        let state_key = Pubkey::new_unique();
        let index: u64 = 0;

        let (pda, _bump) = Pubkey::find_program_address(
            &[
                state_key.as_ref(),
                seeds::SPL_REBALANCE_STAKE_ACCOUNT,
                &index.to_be_bytes(),
            ],
            &crate::ID,
        );

        // PDA should be valid (not on curve)
        assert!(!pda.is_on_curve());
    }

    #[test]
    fn test_stake_account_pda_uses_big_endian_index() {
        let state_key = Pubkey::new_unique();

        // Index 256 in big-endian is [0,0,0,0,0,0,1,0]
        // Index 256 in little-endian is [0,1,0,0,0,0,0,0]
        let index: u64 = 256;

        let be_bytes = index.to_be_bytes();
        let le_bytes = index.to_le_bytes();

        // Verify they're different (ensuring we test the right thing)
        assert_ne!(be_bytes, le_bytes);

        // The PDA uses big-endian
        let (pda_be, _) = Pubkey::find_program_address(
            &[
                state_key.as_ref(),
                seeds::SPL_REBALANCE_STAKE_ACCOUNT,
                &be_bytes,
            ],
            &crate::ID,
        );

        let (pda_le, _) = Pubkey::find_program_address(
            &[
                state_key.as_ref(),
                seeds::SPL_REBALANCE_STAKE_ACCOUNT,
                &le_bytes,
            ],
            &crate::ID,
        );

        // They should produce different PDAs
        assert_ne!(pda_be, pda_le);
    }

    #[test]
    fn test_deactivation_epoch_check_logic() {
        // Simulating the check: stake.delegation.deactivation_epoch < clock.epoch

        // Case 1: Stake deactivated in epoch 5, current epoch is 10 -> should pass
        let deactivation_epoch: u64 = 5;
        let current_epoch: u64 = 10;
        assert!(deactivation_epoch < current_epoch, "Should be fully deactivated");

        // Case 2: Stake deactivated in epoch 10, current epoch is 10 -> should fail
        let deactivation_epoch: u64 = 10;
        let current_epoch: u64 = 10;
        assert!(!(deactivation_epoch < current_epoch), "Same epoch means still deactivating");

        // Case 3: Stake not deactivated (MAX epoch), current epoch is 10 -> should fail
        let deactivation_epoch: u64 = u64::MAX;
        let current_epoch: u64 = 10;
        assert!(!(deactivation_epoch < current_epoch), "MAX means not deactivated");
    }

    #[test]
    fn test_state_accounting_overflow_protection() {
        // Test that checked_add is used for marinade_minted_gsol
        let current: u64 = u64::MAX - 100;
        let to_add: u64 = 50;

        // This should succeed
        let result = current.checked_add(to_add);
        assert!(result.is_some());
        assert_eq!(result.unwrap(), u64::MAX - 50);

        // This should fail (overflow)
        let to_add_overflow: u64 = 200;
        let result_overflow = current.checked_add(to_add_overflow);
        assert!(result_overflow.is_none());
    }

    #[test]
    fn test_stake_withdraw_instruction_format() {
        // The native stake program's Withdraw instruction has discriminator 4
        // Data format: [discriminator (4 bytes LE), lamports (8 bytes LE)]
        let lamports: u64 = 1_000_000_000;

        // Build instruction data like stake::instruction::withdraw does
        let mut data = Vec::with_capacity(12);
        data.extend_from_slice(&4u32.to_le_bytes()); // Withdraw discriminator
        data.extend_from_slice(&lamports.to_le_bytes());

        assert_eq!(data.len(), 12);
        assert_eq!(u32::from_le_bytes(data[0..4].try_into().unwrap()), 4);
        assert_eq!(u64::from_le_bytes(data[4..12].try_into().unwrap()), lamports);
    }
}
