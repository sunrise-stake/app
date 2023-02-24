use super::register_pool::RegisterPool;
use crate::common::*;
use crate::State;
use crate::ErrorCode as CustomError;
use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke_signed},
};
use solana_address_lookup_table_program::{
    self as lookup_program,
};

/// Handler for adding the lookup tables for both Spl and Marinade
/// They can't be added in the same instruction because the table's 
/// address is derived from the current slot
#[derive(Accounts)]
pub struct AddLookupTable<'info> {
    #[account(has_one = update_authority)]
    pub state: Box<Account<'info, State>>,

    pub update_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Checked by CPI to lookup table program
    #[account(mut)]
    pub lookup_table_account: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [state.key().as_ref(), MANAGER], bump
    )]
    pub manager: Box<Account<'info, Manager>>,

    pub system_program: Program<'info, System>,
    
    #[account(address = lookup_program::ID)]
    /// CHECK: Checked via constraints
    pub lookup_table_program: UncheckedAccount<'info>,
}

fn create_table_ix(payer: Pubkey, manager: Pubkey, recent_slot: u64) -> (Instruction, Pubkey) {
    lookup_program::instruction::create_lookup_table_signed(manager, payer, recent_slot)
}

impl<'info> AddLookupTable<'info> {
    pub fn handler(&mut self, manager_bump: u8, recent_slot: u64) -> Result<()> {
        let (ix, table_key) = create_table_ix(self.payer.key(), self.manager.key(), recent_slot);

        let state_key = self.state.key();
        let seeds = &[state_key.as_ref(), MANAGER, &[manager_bump]];
        let signer = &[&seeds[..]];

        invoke_signed(
            &ix,
            &[
                self.lookup_table_program.to_account_info(),
                self.state.to_account_info(),
                self.payer.to_account_info(),
                self.lookup_table_account.to_account_info(),
                self.manager.to_account_info(),
                self.system_program.to_account_info(),
            ],
            signer,
        )?;

        let spl_table = self.manager.spl_lookup_table;
        let marinade_table = self.manager.marinade_lookup_table;
        match (spl_table == Pubkey::default(), marinade_table == Pubkey::default()) {
            (true, _) => self.manager.spl_lookup_table = table_key,
            (false, true) => self.manager.marinade_lookup_table = table_key,
            _ => return Err(CustomError::AlreadyAddedLookupTables.into())
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct ExtendTable<'info> {
    pub state: Account<'info, State>,
    /// CHECK: Checked by CPI
    #[account(mut)]
    pub lookup_table: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [state.key().as_ref(), MANAGER], bump
    )]
    pub manager: Box<Account<'info, Manager>>,

    pub update_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    
    #[account(address = lookup_program::ID)]
    /// CHECK: Checked via constraints
    pub lookup_table_program: UncheckedAccount<'info>,
}

impl<'info> ExtendTable<'info> {
    pub fn handler(&self, addresses: Vec<Pubkey>, manager_bump: u8) -> Result<()> {
        let ix = lookup_program::instruction::extend_lookup_table(
            self.lookup_table.key(),
            self.manager.key(),
            Some(self.payer.key()),
            addresses,
        );

        let state_key = self.state.key();
        let seeds = &[state_key.as_ref(), MANAGER, &[manager_bump]];
        let signer = &[&seeds[..]];

        invoke_signed(
            &ix,
            &[
                self.lookup_table_program.to_account_info(),
                self.lookup_table.to_account_info(),
                self.manager.to_account_info(),
                self.payer.to_account_info(),
                self.system_program.to_account_info(),
            ],
            signer,
        )?;
        Ok(())
    }
}

impl<'a> From<RegisterPool<'a>> for ExtendTable<'a> {
    fn from(accounts: RegisterPool<'a>) -> Self {
        Self {
            state: *accounts.state,
            lookup_table: accounts.lookup_table,
            manager: accounts.manager,
            update_authority: accounts.update_authority,
            payer: accounts.payer,
            system_program: accounts.system_program,
            lookup_table_program: accounts.lookup_table_program,
        }
    }
}

impl<'a> From<&RegisterPool<'a>> for ExtendTable<'a> {
    fn from(accounts: &RegisterPool<'a>) -> Self {
        accounts.to_owned().into()
    }
}

