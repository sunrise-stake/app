#![allow(dead_code)]
//! Accounts for a single stake pool are added to the table in this order:
//! # Stake Pool
//! # Pool token mint
//! # Manager fee account(Fees Depot)
//! # Reserve account
//! # Validator list
//! # Sol deposit authority
//! # Sol withdraw authority
//! # Stake deposit authority
//! # Pool info account

use super::lookup::{ExtendTable, LookupManager, LOOKUP_MANAGER};
use crate::{utils::spl::deserialize_spl_stake_pool, State};
use anchor_lang::prelude::*;
use solana_address_lookup_table_program::state::AddressLookupTable;
use spl_stake_pool::{state::StakePool, ID as PoolProgramId};
use std::ops::Deref;

pub const POOL_WRAPPER: &[u8] = b"pool_wrapper";

pub const LOOKUP_WIDTH: usize = 9;

#[account]
pub struct PoolInfo {
    pool: Pubkey,
    table_index: u8,
}

impl PoolInfo {
    pub const SIZE: usize = 32 + 1 + 8;
}

#[derive(Accounts)]
pub struct RegisterPool<'info> {
    #[account(has_one = update_authority)]
    pub state: Box<Account<'info, State>>,
    #[account(mut)]
    pub update_authority: Signer<'info>,

    // CHECK: Checked in Instruction logic
    pub stake_pool: AccountInfo<'info>,
    #[account(
        init, space = PoolInfo::SIZE,
        payer = update_authority,
        seeds = [stake_pool.key().as_ref(), POOL_WRAPPER],
        bump
    )]
    pub pool_info: Account<'info, PoolInfo>,
    /// CHECK: TODO validate seeds and bump
    pub stake_pool_withdraw_auth: AccountInfo<'info>,
    /// CHECK: TODO validate seeds and bump
    pub stake_pool_deposit_auth: AccountInfo<'info>,

    #[account(
        mut,
        constraint = *lookup_table.key == lookup_manager.spl_lookup
    )]
    pub lookup_table: AccountInfo<'info>,
    #[account(
        mut, signer,
        seeds=[state.key().as_ref(), LOOKUP_MANAGER], bump
    )]
    pub lookup_manager: Box<Account<'info, LookupManager>>,

    pub system_program: Program<'info, System>,
}

fn register_pool_handler(ctx: Context<RegisterPool>) -> Result<()> {
    let manager_bump = *ctx.bumps.get("lookup_manager").unwrap();
    ctx.accounts.register(manager_bump)?;

    Ok(())
}

impl<'info> RegisterPool<'info> {
    fn check_stake_pool(&self) -> Result<StakePool> {
        assert_eq!(*self.stake_pool.owner, PoolProgramId);
        deserialize_spl_stake_pool(&self.stake_pool)
    }

    fn get_stake_pool_addresses(&mut self, stake_pool: &StakePool) -> Result<Vec<Pubkey>> {
        let sol_withdraw_auth = stake_pool
            .sol_withdraw_authority
            .unwrap_or(Pubkey::default());
        let sol_deposit_auth = stake_pool
            .sol_deposit_authority
            .unwrap_or(Pubkey::default());

        let addresses = vec![
            self.stake_pool.key(),
            stake_pool.pool_mint,
            stake_pool.manager_fee_account,
            stake_pool.reserve_stake,
            stake_pool.validator_list,
            sol_deposit_auth,
            sol_withdraw_auth,
            stake_pool.stake_deposit_authority,
            self.pool_info.key(),
        ];

        Ok(addresses)
    }

    fn register(&mut self, manager_bump: u8) -> Result<()> {
        let stake_pool = self.check_stake_pool()?;
        let addresses = self.get_stake_pool_addresses(&stake_pool)?;

        // Extend lookup tables
        let extend_ctx: ExtendTable = self.deref().into();
        extend_ctx.extend(addresses, manager_bump)?;

        // Use the previous index to store the lookup_index for this pool
        let lookup_table_data = self.lookup_table.data.borrow();
        let lookup_table = AddressLookupTable::deserialize(&lookup_table_data)
            .map_err(|_| ErrorCode::AccountDidNotDeserialize)
            .unwrap();
        let previous_length = lookup_table.addresses.len();

        let pool_info = &mut self.pool_info;
        pool_info.pool = self.stake_pool.key();
        pool_info.table_index = u8::try_from(previous_length).unwrap();

        Ok(())
    }
}
