use crate::{
    utils::{seeds, token as TokenUtils},
    State,
};
use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::token::{Mint, Token, TokenAccount};

///   CPI Instructions

///   Deposit SOL directly into the pool's reserve account. The output is a "pool" token
///   representing ownership into the pool. Inputs are converted to the current ratio.
///
///   0. `[w]` Stake pool
///   1. `[]` Stake pool withdraw authority
///   2. `[w]` Reserve stake account, to deposit SOL
///   3. `[s]` Account providing the lamports to be deposited into the pool
///   4. `[w]` User account to receive pool tokens
///   5. `[w]` Account to receive fee tokens
///   6. `[w]` Account to receive a portion of fee as referral fees
///   7. `[w]` Pool token mint account
///   8. `[]` System program account
///   9. `[]` Token program id
///  10. `[s]` (Optional) Stake pool sol deposit authority.

#[derive(Accounts)]
pub struct SplDepositSol<'info> {
    #[account(
        mut,
        has_one = gsol_mint,
        constraint = state.blaze_state == *stake_pool.key
    )]
    pub state: Box<Account<'info, State>>,
    #[account(mut)]
    pub gsol_mint: Box<Account<'info, Mint>>,
    #[account(
        seeds = [state.key().as_ref(), seeds::GSOL_MINT_AUTHORITY],
        bump = state.gsol_mint_authority_bump
    )]
    pub gsol_mint_authority: SystemAccount<'info>,

    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(
        mut,
        token::mint = gsol_mint,
        token::authority = depositor,
    )]
    pub depositor_gsol_token_account: Account<'info, TokenAccount>,

    #[account(mut, token::authority = bsol_account_authority)]
    pub bsol_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [state.key().as_ref(), seeds::BSOL_ACCOUNT],
        bump = state.bsol_authority_bump
    )]
    /// CHECK:
    pub bsol_account_authority: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked by CPI to Spl Stake Program
    pub stake_pool: AccountInfo<'info>,
    /// CHECK: Checked by CPI to Spl Stake Program
    pub stake_pool_withdraw_authority: AccountInfo<'info>,
    /// CHECK: Checked by CPI to Spl Stake Program
    #[account(mut)]
    /// CHECK: Checked by CPI to Spl Stake Program
    pub reserve_stake_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to Spl Stake Program
    pub manager_fee_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to Spl Stake Program
    pub stake_pool_token_mint: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

impl<'info> SplDepositSol<'info> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, spl_stake_pool::ID);
        Ok(())
    }

    pub fn deposit_sol(&mut self, amount: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        invoke(
            &spl_stake_pool::instruction::deposit_sol(
                &spl_stake_pool::ID,
                self.stake_pool.key,
                self.stake_pool_withdraw_authority.key,
                self.reserve_stake_account.key,
                self.depositor.key,
                &self.bsol_token_account.key(),
                self.manager_fee_account.key,
                &self.bsol_token_account.key(),
                self.stake_pool_token_mint.key,
                self.token_program.key,
                amount,
            ),
            &[
                self.stake_pool_program.clone(),
                self.stake_pool.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.reserve_stake_account.clone(),
                self.depositor.to_account_info(),
                self.manager_fee_account.clone(),
                self.bsol_token_account.to_account_info(),
                self.stake_pool_token_mint.clone(),
                self.system_program.to_account_info(),
                self.token_program.to_account_info(),
            ],
        )?;

        TokenUtils::mint_to(
            amount,
            &self.gsol_mint.to_account_info(),
            &self.gsol_mint_authority,
            &self.depositor_gsol_token_account.to_account_info(),
            &self.token_program,
            &self.state,
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_add(amount).unwrap();

        Ok(())
    }
}
