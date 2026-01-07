use crate::state::State;
use crate::utils::{seeds, spl};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program::invoke_signed,
        stake,
    },
};
use anchor_spl::token::{Token, TokenAccount};

const SPL_STAKE_POOL_ID: Pubkey =
    anchor_lang::solana_program::pubkey!("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

/// Create a stake account from the SPL stake pool and deactivate it.
/// This is an admin-only instruction for rebalancing funds between pools.
/// The stake account will be deactivated and can be deposited to Marinade liq pool
/// after it fully deactivates (next epoch boundary).
#[derive(Accounts)]
#[instruction(index: u64)]
pub struct CreateSplStakeAccount<'info> {
    #[account(
        mut,
        has_one = update_authority,
        constraint = state.blaze_state == *stake_pool.key
    )]
    pub state: Box<Account<'info, State>>,

    pub update_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// The new stake account - must be uninitialized, will be created by SPL stake pool
    #[account(
        mut,
        seeds = [state.key().as_ref(), seeds::SPL_REBALANCE_STAKE_ACCOUNT, &index.to_be_bytes()],
        bump
    )]
    /// CHECK: Will be initialized as a stake account by SPL stake pool program
    pub new_stake_account: UncheckedAccount<'info>,

    // SPL Stake Pool accounts
    #[account(mut)]
    /// CHECK: Validated by constraint on state
    pub stake_pool: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub validator_stake_list: UncheckedAccount<'info>,
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub stake_pool_withdraw_authority: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to SPL Stake Pool program - validator or reserve stake account to split from
    pub stake_account_to_split: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub manager_fee_account: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by CPI to SPL Stake Pool program
    pub stake_pool_token_mint: UncheckedAccount<'info>,

    #[account(mut, token::authority = bsol_account_authority)]
    pub bsol_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [state.key().as_ref(), seeds::BSOL_ACCOUNT],
        bump = state.bsol_authority_bump
    )]
    /// CHECK: PDA authority for bSOL token account
    pub bsol_account_authority: UncheckedAccount<'info>,

    #[account(
        seeds = [state.key().as_ref(), seeds::MSOL_ACCOUNT],
        bump = state.msol_authority_bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,

    /// CHECK: Clock sysvar
    pub sysvar_clock: UncheckedAccount<'info>,
    /// CHECK: SPL Stake Pool program - validated in handler
    pub stake_pool_program: UncheckedAccount<'info>,
    /// CHECK: Native stake program
    pub native_stake_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

impl CreateSplStakeAccount<'_> {
    fn check_stake_pool_program(&self) -> Result<()> {
        require_keys_eq!(*self.stake_pool_program.key, SPL_STAKE_POOL_ID);
        Ok(())
    }

    fn calculate_bsol_from_lamports(&self, lamports: u64) -> Result<u64> {
        let stake_pool = spl::deserialize_spl_stake_pool(&self.stake_pool)?;
        spl::calc_bsol_from_lamports(&stake_pool, lamports)
    }
}

pub fn create_spl_stake_account_handler(
    ctx: Context<CreateSplStakeAccount>,
    index: u64,
    lamports: u64,
) -> Result<()> {
    ctx.accounts.check_stake_pool_program()?;

    msg!(
        "Creating stake account from SPL pool: {} lamports, index: {}",
        lamports,
        index
    );

    let state_key = ctx.accounts.state.key();
    let bsol_bump = ctx.accounts.state.bsol_authority_bump;
    let bsol_seeds = [state_key.as_ref(), seeds::BSOL_ACCOUNT, &[bsol_bump]];

    let pool_tokens = ctx.accounts.calculate_bsol_from_lamports(lamports)?;

    // Step 1: Withdraw stake from SPL pool to the new stake account
    // Build instruction data with discriminator 12 for withdrawStake
    let mut data = vec![12u8];
    data.extend_from_slice(&pool_tokens.to_le_bytes());

    // Build accounts list following the SPL stake pool withdraw_stake layout
    let accounts = vec![
        AccountMeta::new(*ctx.accounts.stake_pool.key, false),
        AccountMeta::new(*ctx.accounts.validator_stake_list.key, false),
        AccountMeta::new_readonly(*ctx.accounts.stake_pool_withdraw_authority.key, false),
        AccountMeta::new(*ctx.accounts.stake_account_to_split.key, false),
        AccountMeta::new(ctx.accounts.new_stake_account.key(), false),
        AccountMeta::new_readonly(ctx.accounts.msol_token_account_authority.key(), false), // new stake authority
        AccountMeta::new_readonly(*ctx.accounts.bsol_account_authority.key, true), // pool token transfer authority
        AccountMeta::new(ctx.accounts.bsol_token_account.key(), false),
        AccountMeta::new(*ctx.accounts.manager_fee_account.key, false),
        AccountMeta::new(*ctx.accounts.stake_pool_token_mint.key, false),
        AccountMeta::new_readonly(*ctx.accounts.sysvar_clock.key, false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        AccountMeta::new_readonly(*ctx.accounts.native_stake_program.key, false),
    ];

    let instruction = Instruction {
        program_id: SPL_STAKE_POOL_ID,
        accounts,
        data,
    };

    msg!(
        "Withdrawing {} bSOL ({} lamports) as stake account",
        pool_tokens,
        lamports
    );
    invoke_signed(
        &instruction,
        &[
            ctx.accounts.stake_pool.to_account_info(),
            ctx.accounts.validator_stake_list.to_account_info(),
            ctx.accounts.stake_pool_withdraw_authority.to_account_info(),
            ctx.accounts.stake_account_to_split.to_account_info(),
            ctx.accounts.new_stake_account.to_account_info(),
            ctx.accounts.msol_token_account_authority.to_account_info(),
            ctx.accounts.bsol_account_authority.to_account_info(),
            ctx.accounts.bsol_token_account.to_account_info(),
            ctx.accounts.manager_fee_account.to_account_info(),
            ctx.accounts.stake_pool_token_mint.to_account_info(),
            ctx.accounts.sysvar_clock.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.native_stake_program.to_account_info(),
        ],
        &[&bsol_seeds],
    )?;

    // Step 2: Deactivate the stake account
    // The stake account now has msol_token_account_authority as staker
    msg!("Deactivating stake account");

    let msol_bump = ctx.accounts.state.msol_authority_bump;
    let msol_seeds = [state_key.as_ref(), seeds::MSOL_ACCOUNT, &[msol_bump]];

    let deactivate_ix = stake::instruction::deactivate_stake(
        &ctx.accounts.new_stake_account.key(),
        &ctx.accounts.msol_token_account_authority.key(),
    );

    invoke_signed(
        &deactivate_ix,
        &[
            ctx.accounts.new_stake_account.to_account_info(),
            ctx.accounts.sysvar_clock.to_account_info(),
            ctx.accounts.msol_token_account_authority.to_account_info(),
        ],
        &[&msol_seeds],
    )?;

    // Step 3: Update accounting
    let state = &mut ctx.accounts.state;
    state.blaze_minted_gsol = state.blaze_minted_gsol.checked_sub(lamports).unwrap();

    msg!(
        "Stake account created and deactivated. blaze_minted_gsol: {}. Will be fully deactivated at next epoch.",
        state.blaze_minted_gsol
    );

    Ok(())
}
