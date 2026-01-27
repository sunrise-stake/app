use crate::state::{State, StateInput};
use crate::utils::seeds::{BSOL_ACCOUNT, MSOL_ACCOUNT};
use crate::utils::token::create_token_account;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
#[instruction(state_in: StateInput)]
pub struct UpdateState<'info> {
    #[account(
        mut,
        has_one = update_authority
    )]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub update_authority: Signer<'info>,

    #[account()]
    pub msol_mint: Box<Account<'info, Mint>>,
    #[account()]
    pub bsol_mint: Box<Account<'info, Mint>>,

    /// Must be a PDA, but otherwise owned by the system account ie not initialised with data
    #[account(
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state_in.msol_authority_bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,

    #[account(mut)]
    /// CHECK: If owned by the system program, it is created as an ATA
    pub msol_token_account: UncheckedAccount<'info>,

    #[account()]
    pub liq_pool_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// CHECK: If owned by the system program, it is created as an ATA
    pub liq_pool_token_account: UncheckedAccount<'info>,

    #[account(
    seeds = [state.key().as_ref(), BSOL_ACCOUNT],
    bump = state_in.bsol_authority_bump
    )]
    pub bsol_token_account_authority: SystemAccount<'info>,

    #[account(mut)]
    /// CHECK: If owned by the system program, it is created as an ATA
    pub bsol_token_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn update_state_handler(ctx: Context<UpdateState>, state: StateInput) -> Result<()> {
    // Check the liq_pool_proportion does not exceed 100%
    require_gte!(100, state.liq_pool_proportion);

    let state_account = &mut ctx.accounts.state;
    let gsol_mint = state_account.gsol_mint;

    state_account.set_values(&state, &gsol_mint);

    // Create any token accounts not yet created
    if *ctx.accounts.msol_token_account.owner != ctx.accounts.token_program.key() {
        // create msol token account
        // Note - the relationship between msol_mint and marinade_state is not verified here
        // Specifically, the marinade_state is not passed into the register function as an account.
        // This simplifies the registration code, but if it is registered incorrectly, deposits will fail.
        create_token_account(
            &ctx.accounts.payer,
            &ctx.accounts.msol_token_account,
            &ctx.accounts.msol_mint,
            &ctx.accounts.msol_token_account_authority,
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.associated_token_program,
        )?;
    }

    if *ctx.accounts.liq_pool_token_account.owner != ctx.accounts.token_program.key() {
        // create marinade msol/sol liquidity pool token account
        // the same token account authority PDA is used for the
        // msol token account and the liquidity pool token account
        create_token_account(
            &ctx.accounts.payer,
            &ctx.accounts.liq_pool_token_account,
            &ctx.accounts.liq_pool_mint,
            &ctx.accounts.msol_token_account_authority,
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.associated_token_program,
        )?;
    }

    if *ctx.accounts.bsol_token_account.owner != ctx.accounts.token_program.key() {
        // create bsol token account
        // Note - the relationship between bsol_mint and blaze_state is not verified here
        // Specifically, the blaze_state is not passed into the register function as an account.
        // This simplifies the registration code, but if it is registered incorrectly, deposits will fail.
        create_token_account(
            &ctx.accounts.payer,
            &ctx.accounts.bsol_token_account,
            &ctx.accounts.bsol_mint,
            &ctx.accounts.bsol_token_account_authority,
            &ctx.accounts.system_program,
            &ctx.accounts.token_program,
            &ctx.accounts.associated_token_program,
        )?;
    }

    Ok(())
}
