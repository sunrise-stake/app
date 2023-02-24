use crate::State;
use anchor_lang::{
    prelude::*,
    solana_program::{borsh::try_from_slice_unchecked, program::invoke},
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::State as MarinadeState;
use spl_stake_pool::state::StakePool;
use std::ops::Deref;

pub const MANAGER: &[u8] = b"manager";
pub const MARINADE_ACCOUNTS_WIDTH: u8 = 13;
pub const SPL_ACCOUNTS_WIDTH: u8 = 9;

#[account]
pub struct Manager {
    pub marinade_lookup_table: Pubkey,
    pub spl_lookup_table: Pubkey,
    pub generic_token_account_auth: Pubkey,
    pub marinade_lookup_width: u8,
    pub spl_lookup_width: u8,
    pub spl_pool_count: u8,
    pub spl_pools: [Pubkey; 3], // hardcode 3 and possibly realloc later
}

impl Manager {
    pub fn register_pool(&mut self, pool: Pubkey) -> Option<usize> {
        for (index, entry) in self.spl_pools.iter_mut().enumerate() {
            if *entry == Pubkey::default() {
                *entry = pool;
                return Some(index);
            }
        }

        None
    }
}

impl Manager {
    pub const SIZE: usize = 32 + 32 + 32 + 1 + 1 + 1 + (3 * 32);
}

#[derive(Clone)]
pub struct SplWrapper {
    pub value: StakePool,
}

impl anchor_lang::AccountDeserialize for SplWrapper {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        let value = try_from_slice_unchecked::<StakePool>(buf)
            .map_err(|_| ErrorCode::AccountDidNotDeserialize)?;

        Ok(SplWrapper { value })
    }
}

impl anchor_lang::Owner for SplWrapper {
    fn owner() -> Pubkey {
        spl_stake_pool::ID
    }
}

impl anchor_lang::AccountSerialize for SplWrapper {}

impl Deref for SplWrapper {
    type Target = StakePool;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

impl<'info> SplAccounts<'info> {
    #[inline(never)]
    pub fn deposit(
        &self,
        depositor: &AccountInfo<'info>,
        shared_accounts: &SharedAccounts<'info>,
        amount: u64,
    ) -> Result<()> {
        invoke(
            &spl_stake_pool::instruction::deposit_sol(
                &spl_stake_pool::ID,
                &self.pool.key(),
                self.pool_withdraw_authority.key,
                self.reserve_stake_account.key,
                depositor.key,
                &self.sunrise_pool_mint_token_account.key(),
                self.manager_fee_account.key,
                &self.sunrise_pool_mint_token_account.key(),
                &self.pool_mint.key(),
                &shared_accounts.token_program.key(),
                amount,
            ),
            &[
                self.stake_pool_program.to_owned(),
                self.pool.to_account_info(),
                self.pool_withdraw_authority.to_owned(),
                self.reserve_stake_account.to_owned(),
                depositor.to_owned(),
                self.manager_fee_account.to_owned(),
                self.sunrise_pool_mint_token_account.to_account_info(),
                self.pool_mint.to_account_info(),
                shared_accounts.system_program.to_account_info(),
                shared_accounts.token_program.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

pub struct SolValueShares {
    pub lp_value: u64,
    pub msol_value: u64,
    pub spl_pool_values: Vec<u64>,
    pub total_spl_value: u64,
    pub total_value_staked: u64,
}

#[derive(Clone)]
pub struct SharedAccounts<'info> {
    pub state: Account<'info, State>,
    pub gsol_mint: Account<'info, Mint>,
    pub gsol_mint_authority: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub struct MarinadeAccounts<'info> {
    pub marinade_state: Account<'info, MarinadeState>,
    pub msol_mint: AccountInfo<'info>,
    pub liq_pool_mint: Account<'info, Mint>,
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,
    pub liq_pool_msol_leg_account: Account<'info, TokenAccount>,
    pub liq_pool_msol_leg_authority: AccountInfo<'info>,
    pub liq_pool_mint_authority: AccountInfo<'info>,
    pub treasury_msol_account: AccountInfo<'info>,
    pub reserve_pda: AccountInfo<'info>,
    pub msol_mint_authority: AccountInfo<'info>,
    pub sunrise_msol_token_account: Account<'info, TokenAccount>,
    pub sunrise_liq_pool_token_account: Account<'info, TokenAccount>,
    pub sunrise_msol_account_authority: AccountInfo<'info>,
    ///
    pub marinade_program: AccountInfo<'info>,
}
pub struct SplAccounts<'info> {
    pub pool: Account<'info, SplWrapper>,
    pub pool_mint: Account<'info, Mint>,
    pub manager_fee_account: AccountInfo<'info>,
    pub reserve_stake_account: AccountInfo<'info>,
    pub validator_list: AccountInfo<'info>,
    pub pool_deposit_authority: AccountInfo<'info>,
    pub pool_withdraw_authority: AccountInfo<'info>,
    pub sunrise_pool_mint_token_account: Account<'info, TokenAccount>,
    pub token_account_authority: AccountInfo<'info>,
    ///
    pub stake_pool_program: AccountInfo<'info>,
}
