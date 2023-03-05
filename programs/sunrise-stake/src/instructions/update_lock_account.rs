use crate::error::ErrorCode;
use crate::state::{EpochReportAccount, LockAccount, State};
use crate::utils::seeds::{EPOCH_REPORT_ACCOUNT, IMPACT_NFT_MINT_AUTHORITY, LOCK_ACCOUNT, LOCK_TOKEN_ACCOUNT};
use impact_nft_cpi::cpi::accounts::UpdateNft;
use impact_nft_cpi::cpi::{update_nft as cpi_update_nft};
use impact_nft_cpi::program::ImpactNft;
use impact_nft_cpi::{GlobalState as ImpactNftState};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts, Clone)]
pub struct UpdateLockAccount<'info> {
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
    mut,
    // close = payer,
    constraint = lock_account.start_epoch.is_some() @ ErrorCode::LockAccountNotLocked,
    constraint = lock_account.updated_to_epoch.unwrap() < clock.epoch @ ErrorCode::LockAccountAlreadyUpdated,
    seeds = [state.key().as_ref(), LOCK_ACCOUNT, authority.key().as_ref()],
    bump = lock_account.bump,
    )]
    pub lock_account: Box<Account<'info, LockAccount>>,

    #[account(
    seeds = [state.key().as_ref(), LOCK_TOKEN_ACCOUNT, authority.key().as_ref()],
    bump, // TODO consider storing this in the lock account?
    token::mint = gsol_mint,
    token::authority = lock_account,
    )]
    pub lock_gsol_account: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump = epoch_report_account.bump,
    constraint = epoch_report_account.epoch == clock.epoch @ ErrorCode::InvalidEpochReportAccount
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn update_lock_account_handler(ctx: Context<UpdateLockAccount>) -> Result<()> {
    ctx.accounts.lock_account.updated_to_epoch = Some(ctx.accounts.clock.epoch);

    ctx.accounts.lock_account.calculate_and_add_yield_accrued(
        &ctx.accounts.epoch_report_account,
        &ctx.accounts.lock_gsol_account,
    )?;

    // ctx.accounts.lock_account.yield_accrued_by_owner
    msg!("Updating NFT on impact nft program");
    let state_address = ctx.accounts.state.key();
    let mint_authority_seeds = &[
        state_address.as_ref(),
        IMPACT_NFT_MINT_AUTHORITY,
        &[*ctx.bumps.get("nft_mint_authority").unwrap()],
    ];
    msg!("Mint authority {:?} seeds: {:?}", ctx.accounts.nft_mint_authority.key(), mint_authority_seeds);
    let pda_signer = &[&mint_authority_seeds[..]];

        let cpi_accounts = UpdateNft {
            payer: ctx.accounts.payer.to_account_info(),
            mint_authority: ctx.accounts.nft_mint_authority.to_account_info(),
            mint: ctx.accounts.nft_mint.to_account_info(),
            metadata: ctx.accounts.nft_metadata.to_account_info(),
            mint_nft_to_owner: ctx.accounts.authority.to_account_info(),
            mint_nft_to: ctx.accounts.nft_holder_token_account.to_account_info(),
            master_edition: ctx.accounts.nft_master_edition.to_account_info(),
            offset_tiers: ctx.accounts.offset_tiers.to_account_info(),
            offset_metadata: ctx.accounts.offset_metadata.to_account_info(),
            global_state: ctx.accounts.impact_nft_state.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
        };
        let cpi_program = ctx.accounts.impact_nft_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts)
            .with_signer(pda_signer);

        cpi_update_nft(cpi_ctx, 0)?
}
