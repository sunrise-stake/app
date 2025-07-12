use crate::{
    utils::{seeds, token as TokenUtils},
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
        token::mint = gsol_mint
    )]
    pub depositor_gsol_token_account: Account<'info, TokenAccount>,

    #[account(mut, token::authority = bsol_account_authority)]
    pub bsol_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [state.key().as_ref(), seeds::BSOL_ACCOUNT],
        bump = state.bsol_authority_bump
    )]
    /// CHECK: Checked by CPI to Spl Stake Program
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

const SPL_STAKE_POOL_ID: Pubkey =
    anchor_lang::solana_program::pubkey!("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

impl<'info> SplDepositSol<'info> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, SPL_STAKE_POOL_ID);
        Ok(())
    }

    pub fn deposit_sol(&mut self, amount: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        // Get the bSOL balance before deposit
        let bsol_balance_before = self.bsol_token_account.amount;

        // Build instruction data with discriminator 14 for depositSol
        let mut data = vec![14u8];
        data.extend_from_slice(&amount.to_le_bytes());

        // Build accounts list
        let accounts = vec![
            AccountMeta::new(*self.stake_pool.key, false),
            AccountMeta::new_readonly(*self.stake_pool_withdraw_authority.key, false),
            AccountMeta::new(*self.reserve_stake_account.key, false),
            AccountMeta::new(*self.depositor.key, true),
            AccountMeta::new(self.bsol_token_account.key(), false),
            AccountMeta::new(*self.manager_fee_account.key, false),
            AccountMeta::new(*self.manager_fee_account.key, false), // referral fee account
            AccountMeta::new(*self.stake_pool_token_mint.key, false),
            AccountMeta::new_readonly(self.system_program.key(), false),
            AccountMeta::new_readonly(self.token_program.key(), false),
            // AccountMeta::new_readonly(*self.bsol_account_authority.key, true), // sol deposit authority
        ];

        let instruction = Instruction {
            program_id: SPL_STAKE_POOL_ID,
            accounts,
            data,
        };

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let seeds = [state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bump]];

        invoke_signed(
            &instruction,
            &[
                self.stake_pool.clone(),
                self.stake_pool_withdraw_authority.clone(),
                self.reserve_stake_account.clone(),
                self.depositor.to_account_info(),
                self.bsol_token_account.to_account_info(),
                self.manager_fee_account.clone(),
                self.stake_pool_token_mint.clone(),
                self.system_program.to_account_info(),
                self.token_program.to_account_info(),
                // self.bsol_account_authority.clone(),
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
            &self.gsol_mint_authority,
            &self.depositor_gsol_token_account.to_account_info(),
            &self.token_program,
            &self.state,
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_add(sol_value).unwrap();

        Ok(())
    }
}
