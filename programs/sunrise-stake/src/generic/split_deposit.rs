use crate::state::State;
use crate::utils::seeds::GSOL_MINT_AUTHORITY;
use crate::utils::token::mint_to;
use crate::generic::validate;
use crate::generic::common::*;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::program::MarinadeFinance;
use std::ops::Deref;
use crate::common::SharedAccounts;
use crate::utils::calc;
use crate::generic::utils as generic_utils;

// Marinade pool expected order
/// Marinade state,
/// Msol mint,
/// Liq pool mint,
/// Liq pool sol leg pda,
/// liq pool msol leg
/// liq pool msol leg pda
/// liq pool mint authority
/// reserve pda
/// mint msol to
/// mint liq pool to
/// msol mint authority
/// msol token account authority
/// marinade program

#[derive(Accounts, Clone)]
pub struct SplitDeposit<'info> {
    #[account(mut)]
    pub state: Box<Account<'info, State>>,

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
    pub transfer_from: Signer<'info>,

    #[account(
        mut,
        seeds=[state.key().as_ref(), MANAGER], bump,
        has_one = generic_token_account_auth
    )]
    pub manager: Box<Account<'info, Manager>>,

    /// CHECK: Checked with constraints on `manager` account
    /// we use the same authority for all spl pool token accounts
    pub generic_token_account_auth: UncheckedAccount<'info>,

    #[account(
    mut,
    token::mint = gsol_mint,
    token::authority = transfer_from.key(),
    )]
    pub mint_gsol_to: Box<Account<'info, TokenAccount>>,

    /// CHECK: Checked with constraints
    #[account(address = spl_stake_pool::ID)]
    pub stake_pool_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[inline(never)]
pub fn split_deposit_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, SplitDeposit<'info>>, 
    lamports: u64, 
    marinade_start_offset: u8,
    spl_start_offset: u8,
    spl_pools: u8, // the number of pools passed in through remaining_accounts
) -> Result<()> {
    let marinade_range_end = (marinade_start_offset + MARINADE_ACCOUNTS_WIDTH) as usize;
    require_gte!(ctx.accounts.manager.spl_pools.len(), spl_pools as usize);
    msg!("1.");
    msg!("marinade_range_end: {}", marinade_range_end);

    let marinade_accounts = validate::validate_marinade_accounts(
        &ctx,
        &ctx.accounts.state,
        ctx.accounts.marinade_program.to_account_info(),
        marinade_start_offset as usize,
        marinade_range_end
    )?;

    let mut spl_accounts_vec = Vec::new();

    
    for index in 0..spl_pools {
        let start_index = spl_start_offset + (index * SPL_ACCOUNTS_WIDTH);
        let end_index = start_index + SPL_ACCOUNTS_WIDTH;

        msg!("spl_start_index: {}", start_index);
        msg!("spl_end_index: {}", end_index);

        let spl_accounts = validate::validate_spl_accounts(
            &ctx, 
            &ctx.accounts.stake_pool_program,
            &ctx.accounts.manager,
            start_index as usize, end_index as usize)?;

        spl_accounts_vec.push(spl_accounts);
    }


    msg!("3.");

    let shares = generic_utils::calculate_sol_value_shares(&spl_accounts_vec, &marinade_accounts)?;
    let marinade_limit = calc::proportional( 
        shares.total_value_staked, 75, 100
    )?;

    msg!("4.");

    let shared_accounts: Box<SharedAccounts> = Box::new(ctx.accounts.deref().into());
    let to_deposit_in_liq_pool = generic_utils::amount_to_be_deposited_in_liq_pool(&marinade_accounts, &shared_accounts, lamports)?;
    msg!("to_deposit_in_liq_pool: {}", to_deposit_in_liq_pool);
    let to_stake = lamports.checked_sub(to_deposit_in_liq_pool).unwrap();

    if to_deposit_in_liq_pool > 0 {
        msg!("Depositing {} in liq_pool pool", to_deposit_in_liq_pool);
        generic_utils::add_liquidity(&marinade_accounts, &shared_accounts, &ctx.accounts.transfer_from.to_account_info(), to_deposit_in_liq_pool)?;
    }

    msg!("5.");

    msg!("Mint {} GSOL", lamports);
    mint_to(
        lamports,
        &ctx.accounts.gsol_mint.to_account_info(),
        &ctx.accounts.gsol_mint_authority.to_account_info(),
        &ctx.accounts.mint_gsol_to.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.state,
    )?;

    if to_stake <= 0 {
        return Ok(());
    } 

    let state = &mut ctx.accounts.state;

    if shares.msol_value < marinade_limit {
        // stake to marinade
        msg!("Routing {} lamports to Marinade", to_stake);
        generic_utils::deposit(&marinade_accounts, &shared_accounts, &ctx.accounts.transfer_from.to_account_info(), to_stake)?;
        state.marinade_minted_gsol = state.marinade_minted_gsol.checked_add(to_stake).unwrap();
    } else {
        let index: usize = {
            // choose a spl pool to deposit to
            0
        };
        msg!("Routing {} lamports to spl pool {}", to_stake, index);
        let spl_accounts = &spl_accounts_vec[index];
        spl_accounts.deposit(&ctx.accounts.transfer_from, &shared_accounts, to_stake)?;
        state.blaze_minted_gsol = state.blaze_minted_gsol.checked_add(to_stake).unwrap();
    }

    Ok(())
}

impl<'a> From<SplitDeposit<'a>> for SharedAccounts<'a> {
    fn from(accounts: SplitDeposit<'a>) -> Self {
        Self {
            state: *accounts.state,
            gsol_mint: *accounts.gsol_mint,
            gsol_mint_authority: accounts.gsol_mint_authority,
            system_program: accounts.system_program,
            token_program: accounts.token_program,
        }
    }
}

impl<'a> From<&SplitDeposit<'a>> for SharedAccounts<'a> {
    fn from(accounts: &SplitDeposit<'a>) -> Self {
        accounts.to_owned().into()
    }
}




