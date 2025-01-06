use crate::{
    utils::{self, spl},
    LiquidUnstake, State,
};
use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token::{Mint, Token, TokenAccount};

///   CPI Instructions:
///
///   Withdraw SOL directly from the pool's reserve account. Fails if the
///   reserve does not have enough SOL.
///
///   0. `[w]` Stake pool
///   1. `[]` Stake pool withdraw authority
///   2. `[s]` User transfer authority, for pool token account
///   3. `[w]` User account to burn pool tokens
///   4. `[w]` Reserve stake account, to withdraw SOL
///   5. `[w]` Account receiving the lamports from the reserve, must be a system account
///   6. `[w]` Account to receive pool fee tokens
///   7. `[w]` Pool token mint account
///   8. '[]' Clock sysvar
///   9. '[]' Stake history sysvar
///  10. `[]` Stake program account
///  11. `[]` Token program id
///  12. `[s]` (Optional) Stake pool sol withdraw authority

#[derive(Accounts)]
pub struct SplWithdrawSol<'info> {
    #[account(
        mut,
        has_one = gsol_mint,
        constraint = state.blaze_state == *stake_pool.key
    )]
    pub state: Box<Account<'info, State>>,
    #[account(mut)]
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        token::mint = gsol_mint,
        token::authority = user,
    )]
    pub user_gsol_token_account: Account<'info, TokenAccount>,

    #[account(mut, token::authority = bsol_account_authority)]
    pub bsol_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [state.key().as_ref(), utils::seeds::BSOL_ACCOUNT],
        bump = state.bsol_authority_bump
    )]
    /// CHECK:
    pub bsol_account_authority: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK:
    pub stake_pool: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_withdraw_authority: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    /// CHECK:
    pub reserve_stake_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub manager_fee_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub stake_pool_token_mint: AccountInfo<'info>,
    /// CHECK:
    pub sysvar_clock: AccountInfo<'info>,
    /// CHECK:
    pub sysvar_stake_history: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_program: AccountInfo<'info>,
    /// CHECK:
    pub native_stake_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

impl SplWithdrawSol<'_> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, spl_stake_pool::ID);
        Ok(())
    }

    pub fn withdraw_sol(&mut self, lamports: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let signer_seeds = &[state_key.as_ref(), utils::seeds::BSOL_ACCOUNT, &[bump]];
        let signer_seeds = &[&signer_seeds[..]];

        let stake_pool = spl::deserialize_spl_stake_pool(&self.stake_pool)?;
        let pool_tokens = spl::calc_bsol_from_lamports(&stake_pool, lamports)?;
        invoke_signed(
            &spl_stake_pool::instruction::withdraw_sol(
                &spl_stake_pool::ID,
                self.stake_pool.key,
                self.stake_pool_withdraw_authority.key,
                &self.bsol_account_authority.key(),
                &self.bsol_token_account.key(),
                self.reserve_stake_account.key,
                self.user.key,
                self.manager_fee_account.key,
                self.stake_pool_token_mint.key,
                self.token_program.key,
                pool_tokens,
            ),
            &[
                self.stake_pool_program.clone(),
                self.stake_pool.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.bsol_account_authority.to_account_info(),
                self.bsol_token_account.to_account_info(),
                self.reserve_stake_account.clone(),
                self.user.to_account_info(),
                self.manager_fee_account.clone(),
                self.stake_pool_token_mint.clone(),
                self.sysvar_clock.clone(),
                self.sysvar_stake_history.clone(),
                self.native_stake_program.clone(),
                self.token_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_sub(lamports).unwrap();

        Ok(())
    }
}

impl<'a> From<LiquidUnstake<'a>> for SplWithdrawSol<'a> {
    fn from(props: LiquidUnstake<'a>) -> Self {
        Self {
            state: props.state,
            gsol_mint: props.gsol_mint,
            user: props.gsol_token_account_authority,
            user_gsol_token_account: *props.gsol_token_account,
            bsol_token_account: props.bsol_token_account,
            bsol_account_authority: props.bsol_account_authority,
            stake_pool: props.blaze_stake_pool,
            stake_pool_withdraw_authority: props.stake_pool_withdraw_authority,
            reserve_stake_account: props.reserve_stake_account,
            manager_fee_account: props.manager_fee_account,
            stake_pool_token_mint: props.bsol_mint,
            sysvar_clock: props.clock.to_account_info(),
            sysvar_stake_history: props.sysvar_stake_history,
            stake_pool_program: props.stake_pool_program,
            native_stake_program: props.native_stake_program,
            token_program: props.token_program,
        }
    }
}

impl<'a> From<&LiquidUnstake<'a>> for SplWithdrawSol<'a> {
    fn from(accounts: &LiquidUnstake<'a>) -> Self {
        accounts.to_owned().into()
    }
}
