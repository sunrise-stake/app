use crate::{utils::{seeds, token as TokenUtils}, SunriseState};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::Instruction, program::invoke,
    },
};
use anchor_lang::solana_program::{borsh0_10, borsh1};
use anchor_lang::solana_program::stake::state::StakeStateV2;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::spl_stake_pool::cpi::accounts::{DepositStake, WithdrawStake};
use crate::spl_stake_pool::cpi::{deposit_stake, withdraw_stake};

///   CPI Instructions
///   Deposit some stake into the pool.  The output is a "pool" token representing ownership
///   into the pool. Inputs are converted to the current ratio.
///
///   0. `[w]` Stake pool
///   1. `[w]` Validator stake list storage account
///   2. `[s]/[]` Stake pool deposit authority
///   3. `[]` Stake pool withdraw authority
///   4. `[w]` Stake account to join the pool (withdraw authority for the stake account should be first set to the stake pool deposit authority)
///   5. `[w]` Validator stake account for the stake account to be merged with
///   6. `[w]` Reserve stake account, to withdraw rent exempt reserve
///   7. `[w]` User account to receive pool tokens
///   8. `[w]` Account to receive pool fee tokens
///   9. `[w]` Account to receive a portion of pool fee tokens as referral fees
///   10. `[w]` Pool token mint account
///   11. '[]' Sysvar clock account
///   12. '[]' Sysvar stake history account
///   13. `[]` Pool token program id,
///   14. `[]` Stake program id,
#[derive(Accounts)]
pub struct SplDepositStake<'info> {
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

    pub stake_account_depositor: Signer<'info>,
    #[account(mut)]
    /// CHECK:
    pub stake_account: AccountInfo<'info>,
    #[account(
        mut,
        token::mint = gsol_mint,
        token::authority = stake_account_depositor
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
    /// CHECK: Checked by seeds of pool_details
    pub stake_pool: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub validator_list: AccountInfo<'info>,
    #[account(signer)]
    /// CHECK:
    pub stake_pool_deposit_authority: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_withdraw_authority: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK:
    pub validator_stake_account: AccountInfo<'info>,
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
    pub sysvar_stake_history: AccountInfo<'info>,
    /// CHECK:
    pub sysvar_clock: AccountInfo<'info>,
    /// CHECK:
    pub native_stake_program: AccountInfo<'info>,
    /// CHECK:
    pub stake_pool_program: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

impl SplDepositStake<'_> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, crate::spl_stake_pool::ID);
        Ok(())
    }

    fn authorize_stake_pool(&self, instructions: &[Instruction]) -> Result<()> {
        let authorize_staker_ix = &instructions[0];
        let authorize_withdrawer_ix = &instructions[1];

        let accounts = [
            self.native_stake_program.clone(),
            self.stake_account.clone(),
            self.sysvar_clock.clone(),
            self.stake_account_depositor.to_account_info(),
        ];

        invoke(authorize_staker_ix, &accounts)?;
        invoke(authorize_withdrawer_ix, &accounts)?;
        Ok(())
    }

    pub fn deposit_stake(&mut self) -> Result<()> {
        self.check_stake_pool_program()?;

        let stake_account_info =
            borsh1::try_from_slice_unchecked::<StakeStateV2>(&self.stake_account.data.borrow())?;
        let stake_amount = match stake_account_info.delegation() {
            Some(delegation) => delegation.stake,
            None => return Err(crate::ErrorCode::NotDelegated.into()),
        };

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let seeds = [state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bump]];

        let cpi_ctx = CpiContext::new(
            self.stake_pool_program.clone(),
            DepositStake {
                stake_pool: self.stake_pool.clone(),
                validator_stake_list: self.validator_list.clone(),
                stake_pool_deposit_authority: self.stake_account_depositor.to_account_info(),
                stake_pool_withdraw_authority: self.stake_pool_withdraw_authority.clone(),
                stake_account: self.stake_account.to_account_info(),
                validator_stake_account: self.validator_stake_account.to_account_info(),
                reserve_stake_account: self.reserve_stake_account.to_account_info(),
                user_account: self.bsol_token_account.to_account_info(),
                pool_tokens_amount: self.manager_fee_account.to_account_info(),
                pool_fees_amount: self.manager_fee_account.to_account_info(),
                pool_token_mint_account: self.stake_pool_token_mint.clone(),
                sysvar_clock_account: self.sysvar_clock.clone(),
                sysvar_stake_history_account: self.sysvar_stake_history.to_account_info(),
                pool_token_program_id: self.token_program.to_account_info(),
                stake_program_id: self.native_stake_program.to_account_info()
            }
        );
        deposit_stake(
            cpi_ctx.with_signer(&[&seeds]),
        )?;

        TokenUtils::mint_to(
            stake_amount,
            &self.gsol_mint.to_account_info(),
            &self.gsol_mint_authority.to_account_info(),
            &self.depositor_gsol_token_account.to_account_info(),
            &self.token_program,
            &self.state,
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_add(stake_amount).unwrap();

        Ok(())
    }
}
