use super::common::*;
use crate::{utils::spl::deserialize_spl_stake_pool, State};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken as AToken,
    token::{Mint, Token, TokenAccount},
};
use solana_address_lookup_table_program::{self as lookup_program};
use spl_stake_pool::state::StakePool;

#[allow(unused_imports)]
use crate::generic::lookup_table::ExtendTable;
#[allow(unused_imports)]
use std::ops::Deref;

#[derive(Accounts)]
pub struct RegisterPool<'info> {
    #[account(has_one = update_authority)]
    pub state: Box<Account<'info, State>>,

    pub update_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Checked in handler
    pub stake_pool: UncheckedAccount<'info>,
    pub stake_pool_mint: Account<'info, Mint>,
    /// CHECK:
    pub pool_withdraw_authority: AccountInfo<'info>,
    /// CHECK:
    pub pool_deposit_authority: AccountInfo<'info>,

    /// CHECK: Checked with constraints on `manager` account
    pub generic_token_account_auth: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = stake_pool_mint,
        associated_token::authority = generic_token_account_auth
    )]
    pub sunrise_pool_token_account: Account<'info, TokenAccount>,

    /// CHECK: Checked in handler
    #[account(mut)]
    pub lookup_table: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds=[state.key().as_ref(), MANAGER], bump,
        has_one = generic_token_account_auth
    )]
    pub manager: Box<Account<'info, Manager>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AToken>,
    pub system_program: Program<'info, System>,

    #[account(address = lookup_program::ID)]
    /// CHECK: Checked via constraints
    pub lookup_table_program: UncheckedAccount<'info>,
}

fn check_withdraw_authority(
    account_to_check: &AccountInfo,
    pool: &AccountInfo,
    expected_bump: u8,
) -> Result<()> {
    let (pda, bump) =
        Pubkey::find_program_address(&[pool.key().as_ref(), b"withdraw"], &spl_stake_pool::ID);
    require_keys_eq!(*account_to_check.key, pda);
    require_eq!(bump, expected_bump);
    Ok(())
}

impl<'info> RegisterPool<'info> {
    #[allow(dead_code)]
    fn get_pool_addresses(&mut self, stake_pool: &StakePool) -> Result<Vec<Pubkey>> {
        let addresses = vec![
            self.stake_pool.key(),
            stake_pool.pool_mint,
            stake_pool.manager_fee_account,
            stake_pool.reserve_stake,
            stake_pool.validator_list,
            self.pool_deposit_authority.key(),
            self.pool_withdraw_authority.key(),
            stake_pool.stake_deposit_authority,
            self.sunrise_pool_token_account.key(),
            self.generic_token_account_auth.key(),
        ];

        Ok(addresses)
    }

    pub fn handler(&mut self, _manager_bump: u8) -> Result<()> {
        let stake_pool = deserialize_spl_stake_pool(&self.stake_pool)?;

        require_keys_eq!(self.manager.spl_lookup_table, self.lookup_table.key());
        require_keys_eq!(*self.stake_pool.owner, spl_stake_pool::ID);
        require_keys_eq!(stake_pool.pool_mint, self.stake_pool_mint.key());
        require_keys_eq!(
            stake_pool.stake_deposit_authority,
            *self.pool_deposit_authority.key
        );
        check_withdraw_authority(
            &self.pool_withdraw_authority,
            &self.stake_pool,
            stake_pool.stake_withdraw_bump_seed,
        )?;

        // Exceeded Max Instructions so can't do this
        /*
        let addresses = self.get_pool_addresses(&stake_pool)?;
        let extend_ctx: ExtendTable = self.deref().into();
        extend_ctx.handler(addresses, manager_bump)?;
        */

        if self.manager.register_pool(self.stake_pool.key()).is_none() {
            return Err(crate::error::ErrorCode::CantAddAnyMorePools.into());
        }

        let prev_count = self.manager.spl_pool_count;
        self.manager.spl_pool_count = prev_count.checked_add(1).unwrap();

        Ok(())
    }
}
