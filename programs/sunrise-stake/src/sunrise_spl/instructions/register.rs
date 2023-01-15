use crate::{sunrise_spl::state::SplPoolDetails, ErrorCode, State};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use spl_stake_pool::state::StakePool;

/// Registers a new SPL Stake Pool to Sunrise
#[derive(Accounts)]
pub struct RegisterPool<'info> {
    #[account(has_one = update_authority)]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub update_authority: Signer<'info>,

    /// CHECK: Checked in Instruction
    pub pool: AccountInfo<'info>,
    pub pool_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = update_authority, space = 8 + SplPoolDetails::SIZE,
        seeds = [b"pool".as_ref(), pool.key().as_ref()], bump
    )]
    pub pool_details: Account<'info, SplPoolDetails>,

    #[account(
        init, payer = update_authority,
        seeds = [b"token-vault".as_ref(), pool.key().as_ref()], bump, 
        token::mint = pool_mint, token::authority = pool_details
    )]
    pub pool_token_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> RegisterPool<'info> {
    fn verify_stake_pool_owner(&self) -> Result<()> {
        if self.pool.owner != &spl_stake_pool::ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        Ok(())
    }

    fn verify_stake_pool_mint(&self) -> Result<()> {
        let stake_pool_info = StakePool::try_from_slice(&self.pool.data.borrow())?;
        if stake_pool_info.pool_mint != self.pool_mint.key() {
            return Err(ErrorCode::InvalidMint.into());
        }
        Ok(())
    }

    pub fn register(&mut self, bump: u8) -> Result<()> {
        self.verify_stake_pool_owner()?;
        self.verify_stake_pool_mint()?;

        self.pool_details.pool = *self.pool.key;
        self.pool_details.state = *self.state.to_account_info().key;
        self.pool_details.pool_mint = *self.pool_mint.to_account_info().key;
        self.pool_details.pool_token_vault = *self.pool_token_vault.to_account_info().key;
        self.pool_details.bump = bump;

        Ok(())
    }
}
