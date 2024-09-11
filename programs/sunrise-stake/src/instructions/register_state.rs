use crate::state::{State, StateInput};
use crate::utils::seeds::{BSOL_ACCOUNT, GSOL_MINT_AUTHORITY, MSOL_ACCOUNT};
use crate::utils::token::{create_mint, create_token_account};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
#[instruction(state_in: StateInput)]
pub struct RegisterState<'info> {
    #[account(init, space = State::SPACE, payer = payer)]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

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
    pub msol_token_account: SystemAccount<'info>,

    #[account()]
    pub liq_pool_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub liq_pool_token_account: SystemAccount<'info>,

    #[account(
    seeds = [state.key().as_ref(), BSOL_ACCOUNT],
    bump = state_in.bsol_authority_bump
    )]
    pub bsol_token_account_authority: SystemAccount<'info>,

    /// CHECK: Checked by AssociatedTokenAccount program
    #[account(mut)]
    pub bsol_token_account: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn register_state_handler(ctx: Context<RegisterState>, state: StateInput) -> Result<()> {
    let state_account = &mut ctx.accounts.state;
    state_account.set_values(&state, &ctx.accounts.mint.key(), 0, 0);

    // create the gsol mint
    let gsol_mint_authority = Pubkey::create_program_address(
        &[
            &state_account.key().to_bytes(),
            GSOL_MINT_AUTHORITY,
            &[state_account.gsol_mint_authority_bump],
        ],
        ctx.program_id,
    )
    .unwrap();
    create_mint(
        &ctx.accounts.payer,
        &ctx.accounts.mint.to_account_info(),
        &gsol_mint_authority,
        &ctx.accounts.system_program,
        &ctx.accounts.token_program,
        &ctx.accounts.rent.to_account_info(),
    )?;

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

    Ok(())
}
