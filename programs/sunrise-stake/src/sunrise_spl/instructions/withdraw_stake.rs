use crate::{
    check_mint_supply,
    utils::{calc, seeds, token as TokenUtils},
    State,
};
use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token::{Mint, Token, TokenAccount};
use spl_stake_pool::state::StakePool;

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
    #[account(
        has_one = gsol_mint,
        constraint = state.blaze_state == *stake_pool.key
    )]
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

    #[account(mut, token::authority = bsol_account_authority)]
    pub bsol_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [state.key().as_ref(), seeds::BSOL_ACCOUNT],
        bump = state.bsol_authority_bump
    )]
    pub bsol_account_authority: AccountInfo<'info>,

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

    fn calculate_bsol_from_lamports(&self, lamports: u64) -> Result<u64> {
        let stake_pool = StakePool::try_from_slice(&self.stake_pool.data.borrow())?;
        let token_supply = stake_pool.pool_token_supply;
        let total_lamports = stake_pool.total_lamports;

        let bsol = calc::proportional(lamports, token_supply, total_lamports)?;
        Ok(bsol)
    }

    pub fn withdraw_stake(&mut self, lamports: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key.as_ref();
        let signer_seeds = &[state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bump]];
        let signer_seeds = &[&signer_seeds[..]];

        let pool_tokens = self.calculate_bsol_from_lamports(lamports)?;
        invoke_signed(
            &spl_stake_pool::instruction::withdraw_stake(
                &spl_stake_pool::ID,
                self.stake_pool.key,
                self.validator_stake_list.key,
                self.stake_pool_withdraw_authority.key,
                self.stake_account_to_split.key,
                self.user_new_stake_account.key,
                self.user.key,
                &self.bsol_account_authority.key(),
                &self.bsol_token_account.key(),
                self.manager_fee_account.key,
                self.stake_pool_token_mint.key,
                self.token_program.key,
                pool_tokens,
            ),
            &[
                self.stake_pool_program.clone(),
                self.stake_pool.clone(),
                self.validator_stake_list.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.stake_account_to_split.clone(),
                self.user_new_stake_account.to_account_info(),
                self.user.to_account_info(),
                self.bsol_account_authority.to_account_info(),
                self.bsol_token_account.to_account_info(),
                self.manager_fee_account.clone(),
                self.stake_pool_token_mint.clone(),
                self.sysvar_clock.clone(),
                self.token_program.to_account_info(),
                self.native_stake_program.clone(),
            ],
            signer_seeds,
        )?;

        // Fees may apply so we might be burning more than the user expects

        // let fees = u64::try_from(stake_pool.sol_withdrawal_fee
        //    .apply(equivalent_bsol).unwrap()).ok();
        // We could subtract the fees here so the user doesn't burn more gsol than
        // lamports received
        TokenUtils::burn(
            lamports,
            &self.gsol_mint.to_account_info(),
            &self.user.to_account_info(),
            &self.user_gsol_token_account.to_account_info(),
            &self.token_program,
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol
            .checked_sub(lamports)
            .unwrap();

        check_mint_supply(&self.state, &self.gsol_mint)
    }
}
