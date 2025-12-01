use crate::{
    utils::{seeds, spl, token as TokenUtils},
    State,
};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program::invoke_signed,
    },
};
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
///      userdata: amount of pool tokens to withdraw

#[derive(Accounts)]
pub struct SplWithdrawStake<'info> {
    #[account(
        mut,
        has_one = gsol_mint,
        constraint = state.blaze_state == *stake_pool.key
    )]
    pub state: Box<Account<'info, State>>,
    #[account(mut)]
    pub gsol_mint: Box<Account<'info, Mint>>,

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
    /// CHECK:
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

const SPL_STAKE_POOL_ID: Pubkey =
    anchor_lang::solana_program::pubkey!("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

impl SplWithdrawStake<'_> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, SPL_STAKE_POOL_ID);
        Ok(())
    }

    fn calculate_bsol_from_lamports(&self, lamports: u64) -> Result<u64> {
        let stake_pool = spl::deserialize_spl_stake_pool(&self.stake_pool)?;
        let bsol = spl::calc_bsol_from_lamports(&stake_pool, lamports)?;
        Ok(bsol)
    }

    pub fn withdraw_stake(&mut self, lamports: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let seeds = [state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bump]];

        let pool_tokens = self.calculate_bsol_from_lamports(lamports)?;

        // Build instruction data with discriminator 12 for withdrawStake
        let mut data = vec![12u8];
        data.extend_from_slice(&pool_tokens.to_le_bytes());

        // Build accounts list
        let accounts = vec![
            AccountMeta::new(*self.stake_pool.key, false),
            AccountMeta::new(*self.validator_stake_list.key, false),
            AccountMeta::new_readonly(*self.stake_pool_withdraw_authority.key, false),
            AccountMeta::new(*self.stake_account_to_split.key, false),
            AccountMeta::new(*self.user_new_stake_account.key, false),
            AccountMeta::new_readonly(*self.user.key, false),
            AccountMeta::new_readonly(*self.bsol_account_authority.key, true),
            AccountMeta::new(self.bsol_token_account.key(), false),
            AccountMeta::new(*self.manager_fee_account.key, false),
            AccountMeta::new(*self.stake_pool_token_mint.key, false),
            AccountMeta::new_readonly(*self.sysvar_clock.key, false),
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
                self.validator_stake_list.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.stake_account_to_split.clone(),
                self.user_new_stake_account.clone(),
                self.user.to_account_info(),
                self.bsol_account_authority.clone(),
                self.bsol_token_account.to_account_info(),
                self.manager_fee_account.clone(),
                self.stake_pool_token_mint.clone(),
                self.sysvar_clock.clone(),
                self.token_program.to_account_info(),
                self.native_stake_program.clone(),
            ],
            &[&seeds],
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
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_sub(lamports).unwrap();

        Ok(())
    }
}
