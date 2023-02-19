#![allow(clippy::result_large_err)]
mod sunrise_spl;
mod utils;

use crate::utils::metaplex::update_metadata_account;
use anchor_lang::prelude::borsh::BorshDeserialize;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use sunrise_spl::*;

pub mod state;
use crate::state::*;

pub mod error;
use crate::error::ErrorCode;

pub mod instructions;
use instructions::*;

declare_id!("sunzv8N3A8dRHwUBvxgRDEbWKk8t7yiHR4FLRgFsTX6");

#[program]
pub mod sunrise_stake {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, lamports: u64) -> Result<()> {
        deposit_handler(ctx, lamports)
    }

    pub fn deposit_stake_account(
        ctx: Context<DepositStakeAccount>,
        validator_index: u32,
    ) -> Result<()> {
        deposit_stake_account_handler(ctx, validator_index)
    }

    pub fn order_unstake(ctx: Context<OrderUnstake>, lamports: u64) -> Result<()> {
        order_unstake_handler(ctx, lamports)
    }

    pub fn claim_unstake_ticket(ctx: Context<ClaimUnstakeTicket>) -> Result<()> {
        claim_unstake_ticket_handler(ctx)
    }

    pub fn liquid_unstake(ctx: Context<LiquidUnstake>, lamports: u64) -> Result<()> {
        liquid_unstake_handler(ctx, lamports)
    }

    pub fn trigger_pool_rebalance<'info>(
        ctx: Context<'_, '_, '_, 'info, TriggerPoolRebalance<'info>>,
        epoch: u64,
        index: u64,
        order_unstake_ticket_account_bump: u8,
    ) -> Result<()> {
        trigger_pool_rebalance_handler(ctx, epoch, index, order_unstake_ticket_account_bump)
    }

    pub fn recover_tickets<'info>(
        ctx: Context<'_, '_, '_, 'info, RecoverTickets<'info>>,
    ) -> Result<()> {
        recover_tickets_handler(ctx)
    }

    pub fn recover_missed_epoch<'info>(
        ctx: Context<'_, '_, '_, 'info, RecoverMissedEpoch<'info>>,
    ) -> Result<()> {
        recover_missed_epoch_handler(ctx)
    }

    pub fn extract_to_treasury(ctx: Context<ExtractToTreasury>) -> Result<()> {
        extract_to_treasury_handler(ctx)
    }

    pub fn init_epoch_report<'info>(
        ctx: Context<'_, '_, '_, 'info, InitEpochReport<'info>>,
        extracted_yield: u64,
    ) -> Result<()> {
        init_epoch_report_handler(ctx, extracted_yield)
    }

    //////////////////////////////////////////
    // Blaze Stake Instructions
    /////////////////////////////////////////

    pub fn spl_deposit_sol(ctx: Context<SplDepositSol>, amount: u64) -> Result<()> {
        ctx.accounts.deposit_sol(amount)
    }

    pub fn spl_deposit_stake(ctx: Context<SplDepositStake>) -> Result<()> {
        ctx.accounts.deposit_stake()
    }

    pub fn spl_withdraw_sol(ctx: Context<SplWithdrawSol>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw_sol(amount)
    }

    pub fn spl_withdraw_stake(ctx: Context<SplWithdrawStake>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw_stake(amount)
    }

    ////////////////////////////
    // LOCK FUNCTIONS
    ////////////////////////////
    pub fn init_lock_account<'info>(
        ctx: Context<'_, '_, '_, 'info, InitLockAccount<'info>>,
    ) -> Result<()> {
        init_lock_account_handler(ctx)
    }

    pub fn update_lock_account<'info>(
        ctx: Context<'_, '_, '_, 'info, UpdateLockAccount<'info>>,
    ) -> Result<()> {
        update_lock_account_handler(ctx)
    }

    pub fn lock_gsol<'info>(
        ctx: Context<'_, '_, '_, 'info, LockGSol<'info>>,
        lamports: u64,
    ) -> Result<()> {
        lock_gsol_handler(ctx, lamports)
    }

    pub fn unlock_gsol<'info>(ctx: Context<'_, '_, '_, 'info, UnlockGSol<'info>>) -> Result<()> {
        unlock_gsol_handler(ctx)
    }

    ////////////////////////////
    // ADMIN FUNCTIONS
    ////////////////////////////
    pub fn register_state(ctx: Context<RegisterState>, state: StateInput) -> Result<()> {
        register_state_handler(ctx, state)
    }

    pub fn update_state(ctx: Context<UpdateState>, state: StateInput) -> Result<()> {
        update_state_handler(ctx, state)
    }

    // TODO this is only used during development, to add features to the state account
    // without having to create a new one.
    // Once it is stable, we should remove this function.
    pub fn resize_state(_ctx: Context<ResizeState>, _size: u64) -> Result<()> {
        Ok(())
    }

    pub fn create_metadata(
        ctx: Context<CreateMetadata>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        create_metadata_handler(ctx, uri, name, symbol)
    }

    // used once to create token metadata for gSOL
    pub fn update_metadata(
        ctx: Context<CreateMetadata>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        msg!("Update Metadata for gSol");
        update_metadata_account(ctx.accounts, uri, name, symbol)
    }
}

#[allow(dead_code)]
pub fn check_mint_supply(state: &State, gsol_mint: &Account<Mint>) -> Result<()> {
    require_keys_eq!(state.gsol_mint, gsol_mint.key());
    let expected_total = state
        .blaze_minted_gsol
        .checked_add(state.marinade_minted_gsol)
        .unwrap();
    msg!("blaze_minted_gsol: {}", state.blaze_minted_gsol);
    msg!("marinade_minted_gsol: {}", state.marinade_minted_gsol);
    msg!("expected total: {}", expected_total);
    msg!("actual supply: {}", gsol_mint.supply);

    // Should be impossible but still
    require_eq!(
        expected_total,
        gsol_mint.supply,
        ErrorCode::UnexpectedMintSupply
    );
    Ok(())
}
