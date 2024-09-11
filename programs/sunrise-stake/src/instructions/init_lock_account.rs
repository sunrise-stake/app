use crate::state::{LockAccount, State};
use crate::utils::seeds::{LOCK_ACCOUNT, LOCK_TOKEN_ACCOUNT};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts, Clone)]
pub struct InitLockAccount<'info> {
    #[account(
    has_one = gsol_mint
    )]
    pub state: Box<Account<'info, State>>,
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
    init,
    space = LockAccount::SPACE,
    seeds = [state.key().as_ref(), LOCK_ACCOUNT, authority.key().as_ref()],
    bump,
    payer = payer,
    )]
    pub lock_account: Box<Account<'info, LockAccount>>,

    #[account(
    init,
    seeds = [state.key().as_ref(), LOCK_TOKEN_ACCOUNT, authority.key().as_ref()],
    bump,
    payer = payer,
    token::mint = gsol_mint,
    token::authority = lock_account,
    )]
    pub lock_gsol_account: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn init_lock_account_handler(ctx: Context<InitLockAccount>) -> Result<()> {
    ctx.accounts.lock_account.state_address = ctx.accounts.state.key();
    ctx.accounts.lock_account.start_epoch = None;
    ctx.accounts.lock_account.updated_to_epoch = None;
    ctx.accounts.lock_account.owner = ctx.accounts.authority.key();
    ctx.accounts.lock_account.token_account = ctx.accounts.lock_gsol_account.key();
    ctx.accounts.lock_account.bump = ctx.bumps.lock_account;
    ctx.accounts.lock_account.sunrise_yield_at_start = 0;
    ctx.accounts.lock_account.yield_accrued_by_owner = 0;
    Ok(())
}
