use crate::{
    utils::{seeds, token as TokenUtils},
    State,
};
use anchor_lang::solana_program::stake::state::StakeStateV2;
use anchor_lang::{
    prelude::*,
    solana_program::{
        borsh1,
        instruction::{AccountMeta, Instruction},
        program::{invoke, invoke_signed},
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

const SPL_STAKE_POOL_ID: Pubkey =
    anchor_lang::solana_program::pubkey!("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

impl SplDepositStake<'_> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, SPL_STAKE_POOL_ID);
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

        // Get the bSOL balance before deposit
        let bsol_balance_before = self.bsol_token_account.amount;

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let seeds = [state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bump]];

        // Build instruction data with discriminator 11 for depositStake
        let data = vec![11u8];

        // Build accounts list
        let accounts = vec![
            AccountMeta::new(*self.stake_pool.key, false),
            AccountMeta::new(*self.validator_list.key, false),
            AccountMeta::new_readonly(*self.stake_pool_deposit_authority.key, true),
            AccountMeta::new_readonly(*self.stake_pool_withdraw_authority.key, false),
            AccountMeta::new(*self.stake_account.key, false),
            AccountMeta::new(*self.validator_stake_account.key, false),
            AccountMeta::new(*self.reserve_stake_account.key, false),
            AccountMeta::new(self.bsol_token_account.key(), false),
            AccountMeta::new(self.bsol_token_account.key(), false), // pool tokens amount
            AccountMeta::new(*self.manager_fee_account.key, false), // pool fees amount
            AccountMeta::new(*self.stake_pool_token_mint.key, false),
            AccountMeta::new_readonly(*self.sysvar_clock.key, false),
            AccountMeta::new_readonly(*self.sysvar_stake_history.key, false),
            AccountMeta::new_readonly(self.token_program.key(), false),
            AccountMeta::new_readonly(*self.native_stake_program.key, false),
        ];

        let instruction = Instruction {
            program_id: SPL_STAKE_POOL_ID,
            accounts,
            data,
        };

        invoke_signed(
            &instruction,
            &[
                self.stake_pool.clone(),
                self.validator_list.clone(),
                self.stake_pool_deposit_authority.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.stake_account.clone(),
                self.validator_stake_account.clone(),
                self.reserve_stake_account.clone(),
                self.bsol_token_account.to_account_info(),
                self.manager_fee_account.clone(),
                self.stake_pool_token_mint.clone(),
                self.sysvar_clock.clone(),
                self.sysvar_stake_history.clone(),
                self.token_program.to_account_info(),
                self.native_stake_program.clone(),
            ],
            &[&seeds],
        )?;

        // Reload the bSOL token account to get the updated balance
        self.bsol_token_account.reload()?;

        // Calculate actual bSOL received after fees
        let bsol_balance_after = self.bsol_token_account.amount;
        let actual_bsol_received = bsol_balance_after
            .checked_sub(bsol_balance_before)
            .ok_or(crate::ErrorCode::InvalidCalculation)?;

        // Deserialize the stake pool to get the exchange rate
        let stake_pool = crate::utils::spl::deserialize_spl_stake_pool(&self.stake_pool)?;

        // Convert bSOL tokens to their SOL value
        let sol_value =
            crate::utils::spl::calc_lamports_from_bsol_amount(&stake_pool, actual_bsol_received)?;

        // Mint gSOL based on the SOL value of bSOL received
        TokenUtils::mint_to(
            sol_value,
            &self.gsol_mint.to_account_info(),
            &self.gsol_mint_authority.to_account_info(),
            &self.depositor_gsol_token_account.to_account_info(),
            &self.token_program,
            &self.state,
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_add(sol_value).unwrap();

        Ok(())
    }
}
