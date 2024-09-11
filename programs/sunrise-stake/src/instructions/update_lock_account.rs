use crate::error::ErrorCode;
use crate::state::{EpochReportAccount, LockAccount, State};
use crate::utils::seeds::{
    EPOCH_REPORT_ACCOUNT, IMPACT_NFT_MINT_ACCOUNT, IMPACT_NFT_MINT_AUTHORITY, LOCK_ACCOUNT,
    LOCK_TOKEN_ACCOUNT,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use impact_nft_cpi::cpi::accounts::UpdateNft;
use impact_nft_cpi::cpi::update_nft as cpi_update_nft;
use impact_nft_cpi::program::ImpactNft;
use impact_nft_cpi::GlobalState as ImpactNftState;

#[derive(Accounts, Clone)]
pub struct UpdateLockAccount<'info> {
    #[account(
    has_one = gsol_mint
    )]
    pub state: Box<Account<'info, State>>,
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
    mut,
    constraint = lock_account.start_epoch.is_some() @ ErrorCode::LockAccountNotLocked,
    constraint = lock_account.updated_to_epoch.unwrap() < Clock::get().unwrap().epoch @ ErrorCode::LockAccountAlreadyUpdated,
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
    constraint = epoch_report_account.epoch == Clock::get().unwrap().epoch @ ErrorCode::InvalidEpochReportAccount
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    /// IMPACT NFT ACCOUNTS
    pub impact_nft_program: Program<'info, ImpactNft>,
    pub impact_nft_state: Account<'info, ImpactNftState>,
    pub token_program: Program<'info, Token>,
    /// CHECK: (TODO) checked in impact nft program
    pub token_metadata_program: UncheckedAccount<'info>,
    #[account(
    mut,
    seeds = [state.key().as_ref(), IMPACT_NFT_MINT_ACCOUNT, authority.key().as_ref()],
    bump, // TODO Move to state object?
    )]
    pub nft_mint: Account<'info, Mint>,
    #[account(
    mut, // FIXME: Remove this redundant constraint from both programs
    seeds = [state.key().as_ref(), IMPACT_NFT_MINT_AUTHORITY],
    bump, // TODO Move to state object?
    )]
    pub nft_mint_authority: SystemAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    pub nft_token_authority: UncheckedAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    #[account(mut)]
    pub nft_metadata: UncheckedAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    #[account(mut)]
    pub offset_metadata: UncheckedAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    pub offset_tiers: UncheckedAccount<'info>,

    /// CHECK: (TODO) checked in impact nft program
    pub nft_token_account: UncheckedAccount<'info>,

    /// CHECK: Checked by impactNFT program
    pub nft_new_collection_mint: UncheckedAccount<'info>,
    /// CHECK: Checked by impactNFT program
    #[account(mut)]
    pub nft_new_collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by impactNFT program
    pub nft_new_collection_master_edition: UncheckedAccount<'info>,
    /// CHECK: Checked by impactNFT program
    #[account(mut)]
    pub nft_collection_mint: UncheckedAccount<'info>,
    /// CHECK: Checked by impactNFT program
    #[account(mut)]
    pub nft_collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by impactNFT program
    pub nft_collection_master_edition: UncheckedAccount<'info>,
}

pub fn update_lock_account_handler(ctx: Context<UpdateLockAccount>) -> Result<()> {
    ctx.accounts.lock_account.updated_to_epoch = Some(Clock::get().unwrap().epoch);

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
        &[ctx.bumps.nft_mint_authority],
    ];
    msg!(
        "Mint authority {:?} seeds: {:?}",
        ctx.accounts.nft_mint_authority.key(),
        mint_authority_seeds
    );
    let pda_signer = &[&mint_authority_seeds[..]];

    let cpi_accounts = UpdateNft {
        admin_mint_authority: ctx.accounts.nft_mint_authority.to_account_info(),
        token_authority: ctx.accounts.nft_token_authority.to_account_info(),
        mint: ctx.accounts.nft_mint.to_account_info(),
        metadata: ctx.accounts.nft_metadata.to_account_info(),
        offset_tiers: ctx.accounts.offset_tiers.to_account_info(),
        offset_metadata: ctx.accounts.offset_metadata.to_account_info(),
        global_state: ctx.accounts.impact_nft_state.to_account_info(),
        collection_mint: ctx.accounts.nft_collection_mint.to_account_info(),
        collection_metadata: ctx.accounts.nft_collection_metadata.to_account_info(),
        collection_master_edition: ctx.accounts.nft_collection_master_edition.to_account_info(),
        new_collection_mint: ctx.accounts.nft_new_collection_mint.to_account_info(),
        new_collection_metadata: ctx.accounts.nft_new_collection_metadata.to_account_info(),
        new_collection_master_edition: ctx
            .accounts
            .nft_new_collection_master_edition
            .to_account_info(),
        payer: ctx.accounts.authority.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpi_program = ctx.accounts.impact_nft_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(pda_signer);

    msg!(
        "yield accrued: {}",
        ctx.accounts.lock_account.yield_accrued_by_owner
    );
    cpi_update_nft(cpi_ctx, ctx.accounts.lock_account.yield_accrued_by_owner)
}
