use crate::{
    check_mint_supply,
    utils::{seeds, token as TokenUtils},
    State,
};
use anchor_lang::{
    prelude::*,
    solana_program::{
        borsh::try_from_slice_unchecked, instruction::Instruction, program::invoke,
        stake::state::StakeState,
    },
};
use anchor_spl::token::{Mint, Token, TokenAccount};

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

impl<'info> SplDepositStake<'info> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, spl_stake_pool::ID);
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
        check_mint_supply(&self.state, &self.gsol_mint)?;

        let stake_account_info =
            try_from_slice_unchecked::<StakeState>(&self.stake_account.data.borrow())?;
        let stake_amount = match stake_account_info.delegation() {
            Some(delegation) => delegation.stake,
            None => return Err(crate::ErrorCode::NotDelegated.into()),
        };

        // Returns a Vec<Instruction> of length 3. Ix1 and Ix2 are instructions to
        // transfer staker and withdrawer authority to the stake pool's withdraw authority,
        // a prerequisite for calling Ix3
        let deposit_state_instructions = &spl_stake_pool::instruction::deposit_stake(
            &spl_stake_pool::ID,
            self.stake_pool.key,
            self.validator_list.key,
            self.stake_pool_withdraw_authority.key,
            self.stake_account.key,
            self.stake_account_depositor.key,
            self.validator_stake_account.key,
            self.reserve_stake_account.key,
            &self.bsol_token_account.key(),
            self.manager_fee_account.key,
            &self.bsol_token_account.key(),
            self.stake_pool_token_mint.key,
            self.token_program.key,
        );

        self.authorize_stake_pool(&deposit_state_instructions[..])?;
        invoke(
            &deposit_state_instructions[2],
            &[
                self.stake_pool_program.clone(),
                self.stake_pool.clone(),
                self.validator_list.clone(),
                self.stake_pool_deposit_authority.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.stake_account.clone(),
                self.validator_stake_account.clone(),
                self.reserve_stake_account.clone(),
                self.manager_fee_account.clone(),
                self.bsol_token_account.to_account_info(),
                self.stake_pool_token_mint.clone(),
                self.sysvar_clock.clone(),
                self.sysvar_stake_history.clone(),
                self.token_program.to_account_info(),
                self.native_stake_program.clone(),
            ],
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
