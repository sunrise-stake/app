use anchor_lang::prelude::*;
use crate::generic::common::*;
use crate::State;
use crate::utils::seeds;

#[derive(Accounts)]
pub struct InitializeManager<'info> {
    #[account(has_one = update_authority)]
    pub state: Box<Account<'info, State>>,

    pub update_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [state.key().as_ref(), MANAGER],
        payer = payer, space = 8 + Manager::SIZE, bump
    )]
    pub manager: Box<Account<'info, Manager>>,

    /// Authority of all spl pool token accounts owned by sunrise.
    #[account(
        seeds = [state.key().as_ref(), seeds::BSOL_ACCOUNT],
        bump
    )]
    pub spl_token_account_authority: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeManager<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.manager.generic_token_account_auth = self.spl_token_account_authority.key();
        self.manager.spl_pool_count = 0;
        self.manager.marinade_lookup_width = MARINADE_ACCOUNTS_WIDTH;
        self.manager.spl_lookup_width = SPL_ACCOUNTS_WIDTH;
        Ok(())
    }
}

