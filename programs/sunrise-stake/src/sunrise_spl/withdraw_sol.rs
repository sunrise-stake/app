use crate::{
    utils::{self, spl},
    SunriseState,
};
use anchor_lang::{prelude::*, solana_program::{program::invoke_signed, instruction::{Instruction, AccountMeta}}};
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
    pub state: Box<Account<'info, SunriseState>>,
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

const SPL_STAKE_POOL_ID: Pubkey = anchor_lang::solana_program::pubkey!("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

impl<'info> SplWithdrawSol<'info> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, SPL_STAKE_POOL_ID);
        Ok(())
    }

    pub fn withdraw_sol(&mut self, lamports: u64) -> Result<()> {
        self.check_stake_pool_program()?;

        let bump = self.state.bsol_authority_bump;
        let state_key = self.state.to_account_info().key;
        let seeds = [state_key.as_ref(), utils::seeds::BSOL_ACCOUNT, &[bump]];

        let stake_pool = spl::deserialize_spl_stake_pool(&self.stake_pool)?;
        let pool_tokens = spl::calc_bsol_from_lamports(&stake_pool, lamports)?;

        // Build instruction data with discriminator 15 for withdrawSol
        let mut data = vec![15u8];
        data.extend_from_slice(&pool_tokens.to_le_bytes());
        data.extend_from_slice(&lamports.to_le_bytes()); // min_lamports

        // Build accounts list
        let accounts = vec![
            AccountMeta::new(*self.stake_pool.key, false),
            AccountMeta::new_readonly(*self.stake_pool_withdraw_authority.key, false),
            AccountMeta::new_readonly(*self.bsol_account_authority.key, true), // transfer authority
            AccountMeta::new(self.bsol_token_account.key(), false), // burn pool tokens
            AccountMeta::new(*self.reserve_stake_account.key, false),
            AccountMeta::new(*self.user.key, false), // withdraw account
            AccountMeta::new(*self.manager_fee_account.key, false), // fee token account
            AccountMeta::new(*self.stake_pool_token_mint.key, false), // pool token mint
            AccountMeta::new_readonly(*self.sysvar_clock.key, false),
            AccountMeta::new_readonly(*self.sysvar_stake_history.key, false),
            AccountMeta::new_readonly(*self.native_stake_program.key, false),
            AccountMeta::new_readonly(self.token_program.key(), false),
            AccountMeta::new_readonly(*self.bsol_account_authority.key, true), // sol withdraw authority
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
                self.stake_pool_withdraw_authority.clone(),
                self.bsol_account_authority.clone(),
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
            &[&seeds],
        )?;

        let state = &mut self.state;
        self.state.blaze_minted_gsol = state.blaze_minted_gsol.checked_sub(lamports).unwrap();

        Ok(())
    }
}

