#![allow(dead_code)]

use crate::State;
use anchor_lang::{
    prelude::*,
    solana_program::{clock, instruction::Instruction, program::invoke_signed},
};
use solana_address_lookup_table_program as lookup_program;

pub const LOOKUP_MANAGER: &[u8] = b"lookup_tables_manager";

#[account]
pub struct LookupManager {
    pub spl_lookup: Pubkey,
    pub marinade_lookup: Pubkey,
}

#[derive(Accounts)]
pub struct RegisterLookupManager<'info> {
    #[account(has_one = update_authority)]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub update_authority: Signer<'info>,

    #[account(
        init,
        seeds = [state.key().as_ref(), LOOKUP_MANAGER],
        payer = update_authority, space = 8, bump
    )]
    pub lookup_manager: Box<Account<'info, LookupManager>>,

    pub system_program: Program<'info, System>,
}

impl<'info> RegisterLookupManager<'info> {
    pub fn register(&self) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitSplLookup<'info> {
    #[account(has_one = update_authority)]
    pub state: Box<Account<'info, State>>,

    #[account(mut, address=state.update_authority)]
    pub update_authority: Signer<'info>,

    /// CHECK:
    #[account(mut)]
    pub lookup_table_account: AccountInfo<'info>,
    #[account(
        mut, signer,
        seeds = [state.key().as_ref(), LOOKUP_MANAGER], bump
    )]
    pub lookup_manager: Box<Account<'info, LookupManager>>,

    pub system_program: Program<'info, System>,
}

pub fn get_create_ix(payer: Pubkey, authority: Pubkey) -> (Instruction, Pubkey) {
    let recent_slot = clock::Clock::get().unwrap().slot;
    lookup_program::instruction::create_lookup_table_signed(authority, payer, recent_slot)
}

impl<'info> InitSplLookup<'info> {
    pub fn initialize(&mut self, manager_bump: u8) -> Result<()> {
        let (ix, table_key) = get_create_ix(self.update_authority.key(), self.lookup_manager.key());

        let state_key = self.state.key();
        let seeds = &[state_key.as_ref(), LOOKUP_MANAGER, &[manager_bump]];
        let signer = &[&seeds[..]];

        invoke_signed(
            &ix,
            &[
                self.state.to_account_info(),
                self.update_authority.to_account_info(),
                self.lookup_table_account.clone(),
                self.lookup_manager.to_account_info(),
                self.system_program.to_account_info(),
            ],
            signer,
        )?;

        // TODO: Add general spl_stake_pool relevant accounts?
        // Stake pool program
        // Sysvar stake history
        // Stake program
        // Sysvar clock

        let lookup_manager = &mut self.lookup_manager;
        lookup_manager.marinade_lookup = table_key;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitMarinadeLookup<'info> {
    #[account(has_one = update_authority)]
    pub state: Box<Account<'info, State>>,
    #[account(mut, address=state.update_authority)]
    pub update_authority: Signer<'info>,

    /// CHECK:
    #[account(mut)]
    pub lookup_table_account: AccountInfo<'info>,
    #[account(
        mut, signer,
        seeds = [state.key().as_ref(), LOOKUP_MANAGER], bump
    )]
    pub lookup_manager: Box<Account<'info, LookupManager>>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitMarinadeLookup<'info> {
    pub fn initialize(&mut self, manager_bump: u8) -> Result<()> {
        let (ix, table_key) = get_create_ix(self.update_authority.key(), self.lookup_manager.key());

        let state_key = self.state.key();
        let seeds = &[state_key.as_ref(), LOOKUP_MANAGER, &[manager_bump]];
        let signer = &[&seeds[..]];

        invoke_signed(
            &ix,
            &[
                self.state.to_account_info(),
                self.update_authority.to_account_info(),
                self.lookup_table_account.clone(),
                self.lookup_manager.to_account_info(),
                self.system_program.to_account_info(),
            ],
            signer,
        )?;

        let lookup_manager = &mut self.lookup_manager;
        lookup_manager.marinade_lookup = table_key;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ExtendTable<'info> {
    pub state: Account<'info, State>,
    /// CHECK:
    #[account(mut)]
    pub lookup_table: AccountInfo<'info>,
    #[account(
        mut, signer,
        seeds = [state.key().as_ref(), LOOKUP_MANAGER], bump
    )]
    pub lookup_manager: Box<Account<'info, LookupManager>>,

    #[account(mut)]
    pub update_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> ExtendTable<'info> {
    pub fn extend(&self, addresses: Vec<Pubkey>, manager_bump: u8) -> Result<()> {
        let table_key = *self.lookup_table.key;

        if !(table_key == self.lookup_manager.spl_lookup
            || table_key == self.lookup_manager.marinade_lookup)
        {
            return Err(ErrorCode::AccountOwnedByWrongProgram.into());
        }

        let ix = lookup_program::instruction::extend_lookup_table(
            self.lookup_table.key(),
            self.lookup_manager.key(),
            Some(self.update_authority.key()),
            addresses,
        );

        let state_key = self.state.key();
        let seeds = &[state_key.as_ref(), LOOKUP_MANAGER, &[manager_bump]];
        let signer = &[&seeds[..]];

        invoke_signed(
            &ix,
            &[
                self.lookup_table.clone(),
                self.lookup_manager.to_account_info(),
                self.update_authority.to_account_info(),
                self.system_program.to_account_info(),
            ],
            signer,
        )?;
        Ok(())
    }
}

use super::pool::RegisterPool;

impl<'a> From<RegisterPool<'a>> for ExtendTable<'a> {
    fn from(accounts: RegisterPool<'a>) -> Self {
        Self {
            state: *accounts.state,
            lookup_table: accounts.lookup_table,
            lookup_manager: accounts.lookup_manager,
            update_authority: accounts.update_authority,
            system_program: accounts.system_program,
        }
    }
}

impl<'a> From<&RegisterPool<'a>> for ExtendTable<'a> {
    fn from(accounts: &RegisterPool<'a>) -> Self {
        accounts.to_owned().into()
    }
}
