use crate::{
    utils::{self, spl},
    LiquidUnstake, State,
};
use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::spl_stake_pool::cpi::accounts::{WithdrawSol, WithdrawStake};
use crate::spl_stake_pool::cpi::{withdraw_sol, withdraw_stake};

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

impl<'info> SplWithdrawSol<'info> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, crate::spl_stake_pool::ID);
        Ok(())
    }

    pub fn withdraw_sol(&mut self, lamports: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let seeds = [state_key.as_ref(), utils::seeds::BSOL_ACCOUNT, &[bump]];

        let stake_pool = spl::deserialize_spl_stake_pool(&self.stake_pool)?;
        let pool_tokens = spl::calc_bsol_from_lamports(&stake_pool, lamports)?;

        let withdraw_sol_accounts: WithdrawSol = (self as &SplWithdrawSol<'info>).into();
        let cpi_ctx: CpiContext<'_, '_, '_, 'info, WithdrawSol> = CpiContext::new(
            self.stake_pool_program.clone(),
            withdraw_sol_accounts
        );
        withdraw_sol(
            cpi_ctx.with_signer(&[&seeds]),
            pool_tokens
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_sub(lamports).unwrap();

        Ok(())
    }
}

impl<'a> From<LiquidUnstake<'a>> for WithdrawSol<'a> {
    fn from(props: LiquidUnstake<'a>) -> Self {
        Self {
            stake_pool: props.blaze_stake_pool,
            withdraw_authority: props.stake_pool_withdraw_authority.clone(),
            transfer_authority: props.bsol_account_authority,
            burn_pool_tokens: props.bsol_token_account.to_account_info(),  // TODO ???
            reserve_stake_account: props.reserve_stake_account,
            withdraw_account: props.bsol_token_account.to_account_info(),
            fee_token_account: props.manager_fee_account.to_account_info(),
            pool_token_mint: props.bsol_mint,
            sol_withdraw_authority: props.stake_pool_withdraw_authority.clone(),
            sysvar_clock: props.clock.to_account_info(),
            sysvar_stake_history: props.sysvar_stake_history,
            stake_program: props.native_stake_program,
            token_program: props.token_program.to_account_info(),
        }
    }
}

impl<'a> From<&LiquidUnstake<'a>> for WithdrawSol<'a> {
    fn from(accounts: &LiquidUnstake<'a>) -> Self {
        accounts.to_owned().into()
    }
}

impl<'a> From<SplWithdrawSol<'a>> for WithdrawSol<'a> {
    fn from(props: SplWithdrawSol<'a>) -> Self {
        Self {
            stake_pool: props.stake_pool,
            withdraw_authority: props.stake_pool_withdraw_authority.clone(),
            transfer_authority: props.bsol_account_authority,
            burn_pool_tokens: props.bsol_token_account.to_account_info(),  // TODO ???
            reserve_stake_account: props.reserve_stake_account,
            withdraw_account: props.bsol_token_account.to_account_info(),
            fee_token_account: props.manager_fee_account.to_account_info(),
            pool_token_mint: props.stake_pool_token_mint,
            sol_withdraw_authority: props.stake_pool_withdraw_authority.clone(),
            sysvar_clock: props.sysvar_clock.to_account_info(),
            sysvar_stake_history: props.sysvar_stake_history,
            stake_program: props.native_stake_program,
            token_program: props.token_program.to_account_info(),
        }
    }
}

impl<'a> From<&SplWithdrawSol<'a>> for WithdrawSol<'a> {
    fn from(accounts: &SplWithdrawSol<'a>) -> Self {
        accounts.to_owned().into()
    }
}
