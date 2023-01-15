use crate::{
    sunrise_spl::state::SplPoolDetails,
    utils::{seeds, token as TokenUtils},
    State,
};
use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token::{Mint, Token, TokenAccount};

///   CPI Instructions:
///
///   Withdraw the token from the pool at the current ratio.
///
///   Succeeds if the stake account has enough SOL to cover the desired amount
///   of pool tokens, and if the withdrawal keeps the total staked amount
///   above the minimum of rent-exempt amount +
///   `max(crate::MINIMUM_ACTIVE_STAKE, solana_program::stake::tools::get_minimum_delegation())`.
///
///   When allowing withdrawals, the order of priority goes:
///
///   * preferred withdraw validator stake account (if set)
///   * validator stake accounts
///   * transient stake accounts
///   * reserve stake account OR totally remove validator stake accounts
///
///   A user can freely withdraw from a validator stake account, and if they
///   are all at the minimum, then they can withdraw from transient stake
///   accounts, and if they are all at minimum, then they can withdraw from
///   the reserve or remove any validator from the pool.
///
///   0. `[w]` Stake pool
///   1. `[w]` Validator stake list storage account
///   2. `[]` Stake pool withdraw authority
///   3. `[w]` Validator or reserve stake account to split
///   4. `[w]` Unitialized stake account to receive withdrawal
///   5. `[]` User account to set as a new withdraw authority
///   6. `[s]` User transfer authority, for pool token account
///   7. `[w]` User account with pool tokens to burn from
///   8. `[w]` Account to receive pool fee tokens
///   9. `[w]` Pool token mint account
///  10. `[]` Sysvar clock account (required)
///  11. `[]` Pool token program id
///  12. `[]` Stake program id,
///  userdata: amount of pool tokens to withdraw

#[derive(Accounts)]
pub struct SplWithdrawStake<'info> {
    #[account(has_one = gsol_mint)]
    pub state: Box<Account<'info, State>>,
    pub gsol_mint: Box<Account<'info, Mint>>,
    #[account(
        seeds = [state.key().as_ref(), seeds::GSOL_MINT_AUTHORITY],
        bump = state.gsol_mint_authority_bump
    )]
    pub gsol_mint_authority: SystemAccount<'info>,

    pub user: Signer<'info>,
    #[account(
        mut,
        token::mint = gsol_mint,
        token::authority = user,
    )]
    pub user_gsol_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    /// CHECK:
    pub user_new_stake_account: AccountInfo<'info>, //Should be an uninitialized stake account

    #[account(
        mut, has_one = state, has_one = pool_token_vault,
        seeds = [b"pool".as_ref(), stake_pool.key().as_ref()], bump
    )]
    pub pool_details: Account<'info, SplPoolDetails>,
    #[account(mut)]
    pub pool_token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK:
    pub stake_pool: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_withdraw_authority: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub validator_stake_list: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub stake_account_to_split: AccountInfo<'info>, //either validator/reserve
    #[account(mut)]
    /// CHECK:
    pub manager_fee_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub stake_pool_token_mint: AccountInfo<'info>,
    /// CHECK:
    pub sysvar_clock: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_program: AccountInfo<'info>,
    /// CHECK:
    pub native_stake_program: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

impl<'info> SplWithdrawStake<'info> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, spl_stake_pool::ID);
        Ok(())
    }

    pub fn withdraw_stake(&self, amount: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        let bump = self.pool_details.bump;
        let signer_seeds = &[b"pool".as_ref(), &self.stake_pool.key.as_ref(), &[bump]];
        let signer_seeds = &[&signer_seeds[..]];

        invoke_signed(
            &spl_stake_pool::instruction::withdraw_stake(
                &spl_stake_pool::ID,
                self.stake_pool.key,
                self.validator_stake_list.key,
                self.stake_pool_withdraw_authority.key,
                self.stake_account_to_split.key,
                self.user_new_stake_account.key,
                self.user.key,
                &self.pool_details.key(),
                &self.pool_token_vault.key(),
                self.manager_fee_account.key,
                self.stake_pool_token_mint.key,
                self.token_program.key,
                amount,
            ),
            &[
                self.stake_pool_program.clone(),
                self.stake_pool.clone(),
                self.validator_stake_list.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.stake_account_to_split.clone(),
                self.user_new_stake_account.to_account_info(),
                self.user.to_account_info(),
                self.pool_details.to_account_info(),
                self.pool_token_vault.to_account_info(),
                self.manager_fee_account.clone(),
                self.stake_pool_token_mint.clone(),
                self.sysvar_clock.clone(),
                self.token_program.to_account_info(),
                self.native_stake_program.clone(),
            ],
            signer_seeds,
        )?;

        TokenUtils::burn(
            amount,
            &self.gsol_mint.to_account_info(),
            &self.gsol_mint_authority,
            &self.user_gsol_token_account.to_account_info(),
            &self.token_program,
        )
    }
}
