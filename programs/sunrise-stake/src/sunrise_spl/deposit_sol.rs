use crate::{utils, utils::{seeds, token as TokenUtils}, SunriseState};
use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::spl_stake_pool::cpi::accounts::{DepositSol, WithdrawSol};
use crate::spl_stake_pool::cpi::{deposit_sol, withdraw_sol};
use crate::sunrise_spl::SplWithdrawSol;

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

#[derive(Accounts, Clone)]
pub struct SplDepositSol<'info> {
    #[account(
        mut,
        has_one = gsol_mint,
        constraint = state.blaze_state == *stake_pool.key
    )]
    pub state: Box<Account<'info, SunriseState>>,
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
        token::mint = gsol_mint
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
        require_keys_eq!(*self.stake_pool_program.key, crate::spl_stake_pool::ID);
        Ok(())
    }

    pub fn deposit_sol(&mut self, amount: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let seeds = [state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bump]];

        let deposit_sol_accounts: DepositSol = (self as &SplDepositSol<'info>).into();
        let cpi_ctx: CpiContext<'_, '_, '_, 'info, DepositSol> = CpiContext::new(
            self.stake_pool_program.clone(),
            deposit_sol_accounts
        );
        deposit_sol(
            cpi_ctx.with_signer(&[&seeds]),
            amount
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


impl<'a> From<SplDepositSol<'a>> for DepositSol<'a> {
    fn from(props: SplDepositSol<'a>) -> Self {
        Self {
            // The SPL stake pool being deposited into
            stake_pool: props.stake_pool,
            // The PDA able to withdraw from the stake pool
            stake_pool_withdraw_authority: props.stake_pool_withdraw_authority.clone(),
            // The account for SOL not yet staked against validators (where the SOL goes)
            reserve_stake_account: props.reserve_stake_account,
            // The account providing the lamports to be deposited (maps to 'depositer' in IDL)
            depositer: props.depositor.to_account_info(),
            // Account to receive pool tokens (maps to 'userAccount' in IDL)
            user_account: props.bsol_token_account.to_account_info(),
            // Manager fee account (maps to 'feeAccount' in IDL)
            fee_account: props.manager_fee_account.to_account_info(),
            // Referrer pool tokens account (maps to 'referralFeeAccount' in IDL)
            referral_fee_account: props.manager_fee_account.to_account_info(),
            // Pool mint account (maps to 'poolTokenMint' in IDL)
            pool_token_mint: props.stake_pool_token_mint,
            // System program
            system_program: props.system_program.to_account_info(),
            // Token program (maps to 'tokenProgramId' in IDL)
            token_program_id: props.token_program.to_account_info(),
            // Deposit authority - the PDA that signs the transaction
            deposit_authority: props.bsol_account_authority.clone(),
        }
    }
}

impl<'a> From<&SplDepositSol<'a>> for DepositSol<'a> {
    fn from(accounts: &SplDepositSol<'a>) -> Self {
        accounts.to_owned().into()
    }
}
