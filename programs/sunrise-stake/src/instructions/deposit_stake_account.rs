use crate::state::State;
use crate::utils::marinade;
use crate::utils::seeds::{GSOL_MINT_AUTHORITY, MSOL_ACCOUNT};
use crate::utils::token::mint_to;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;

#[derive(Accounts, Clone)]
pub struct DepositStakeAccount<'info> {
    #[account(mut, has_one = marinade_state)]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(
        mut,
        constraint = gsol_mint.mint_authority == COption::Some(gsol_mint_authority.key()),
    )]
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(
    seeds = [
    state.key().as_ref(),
    GSOL_MINT_AUTHORITY,
    ],
    bump = state.gsol_mint_authority_bump,
    )]
    pub gsol_mint_authority: SystemAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub validator_list: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub stake_list: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub stake_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub duplication_flag: AccountInfo<'info>,

    /// Marinade makes a distinction between the `stake_authority`(proof of ownership of stake account)
    /// and the `rent_payer`(pays to init the validator_record account). Both are required to be signers
    /// for the instruction. These two accounts can be treated as one and the same, and here, they are.
    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub stake_authority: Signer<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    #[account(
    mut,
    token::mint = msol_mint,
    token::authority = msol_token_account_authority,
    )]
    pub mint_msol_to: Account<'info, TokenAccount>,

    #[account(
    mut,
    token::mint = gsol_mint,
    token::authority = stake_authority.key(),
    )]
    pub mint_gsol_to: Account<'info, TokenAccount>,

    /// CHECK: Checked in marinade program
    pub msol_mint_authority: AccountInfo<'info>,

    #[account(
    seeds = [state.key().as_ref(), MSOL_ACCOUNT],
    bump = state.msol_authority_bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Checked in marinade program
    pub stake_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

pub fn deposit_stake_account_handler(
    ctx: Context<DepositStakeAccount>,
    validator_index: u32,
) -> Result<()> {
    let lamports = marinade::get_delegated_stake_amount(&ctx.accounts.stake_account)?;

    msg!("Depositing stake account");
    marinade::deposit_stake_account(ctx.accounts, validator_index)?;

    msg!("Mint {} GSOL", lamports);
    mint_to(
        lamports,
        &ctx.accounts.gsol_mint.to_account_info(),
        &ctx.accounts.gsol_mint_authority.to_account_info(),
        &ctx.accounts.mint_gsol_to.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.state,
    )?;
    let state = &mut ctx.accounts.state;
    state.marinade_minted_gsol = state.marinade_minted_gsol.checked_add(lamports).unwrap();
    Ok(())
}
