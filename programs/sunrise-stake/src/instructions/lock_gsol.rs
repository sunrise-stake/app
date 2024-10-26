use crate::error::ErrorCode;
use crate::state::{EpochReportAccount, LockAccount, State};
use crate::utils::seeds::{
    EPOCH_REPORT_ACCOUNT, IMPACT_NFT_MINT_ACCOUNT, IMPACT_NFT_MINT_AUTHORITY, LOCK_TOKEN_ACCOUNT,
};
use crate::utils::token::transfer_to;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::impact_nft_cpi::cpi::accounts::MintNft;
use crate::impact_nft_cpi::cpi::mint_nft as cpi_mint_nft;
use crate::impact_nft_cpi::program::ImpactNft;
use crate::impact_nft_cpi::GlobalState as ImpactNftState;

#[derive(Accounts, Clone)]
#[instruction(lamports: u64)]
pub struct LockGSol<'info> {
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
    constraint = lock_account.owner == authority.key() @ ErrorCode::LockAccountIncorrectOwner,
    constraint = lock_account.state_address == state.key() @ ErrorCode::LockAccountIncorrectState,
    constraint = lock_account.start_epoch.is_none() @ ErrorCode::LockAccountAlreadyLocked,
    )]
    pub lock_account: Box<Account<'info, LockAccount>>,

    #[account(
    mut,
    token::mint = gsol_mint,
    token::authority = authority.key(),
    )]
    pub source_gsol_account: Box<Account<'info, TokenAccount>>,

    #[account(
    mut,
    seeds = [state.key().as_ref(), LOCK_TOKEN_ACCOUNT, authority.key().as_ref()],
    bump, // TODO consider storing this in the lock account?
    token::mint = gsol_mint,
    token::authority = lock_account,
    )]
    pub lock_gsol_account: Box<Account<'info, TokenAccount>>,

    #[account(
    seeds = [state.key().as_ref(), EPOCH_REPORT_ACCOUNT],
    bump,
    constraint = epoch_report_account.epoch == clock.epoch @ ErrorCode::InvalidEpochReportAccount
    )]
    pub epoch_report_account: Box<Account<'info, EpochReportAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

    /// IMPACT NFT ACCOUNTS
    pub impact_nft_program: Program<'info, ImpactNft>,
    pub impact_nft_state: Box<Account<'info, ImpactNftState>>,
    /// CHECK: (TODO) checked in impact nft program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// CHECK: If this is the first time the user is minting an NFT, this account will be initialized
    /// by the impact nft program. If not, then it is not used (re-locking a lock account does not
    /// result in a new NFT being minted)
    #[account(
    mut,
    seeds = [state.key().as_ref(), IMPACT_NFT_MINT_ACCOUNT, authority.key().as_ref()],
    bump, // TODO Move to state object?
    )]
    pub nft_mint: UncheckedAccount<'info>,
    #[account(
    seeds = [state.key().as_ref(), IMPACT_NFT_MINT_AUTHORITY],
    bump, // TODO Move to state object?
    )]
    pub nft_mint_authority: SystemAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    pub nft_token_authority: UncheckedAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    #[account(mut)]
    pub nft_metadata: UncheckedAccount<'info>,
    /// CHECK: May be uninitialized - if so, it will be initialized by the impact nft program
    #[account(mut)]
    pub nft_holder_token_account: UncheckedAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    #[account(mut)]
    pub nft_master_edition: UncheckedAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    #[account(mut)]
    pub offset_metadata: UncheckedAccount<'info>,
    /// CHECK: (TODO) checked in impact nft program
    pub offset_tiers: UncheckedAccount<'info>,

    /// CHECK: Checked by impact-nft program
    pub nft_collection_mint: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: Checked by impact-nft program
    pub nft_collection_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked by impact-nft program
    pub nft_collection_master_edition: UncheckedAccount<'info>,
    // #[account(mut)]
    // /// CHECK: Checked by impact-nft program
    // pub nft_fee_payer_token_account: Option<Box<Account<'info, TokenAccount>>>,
    // #[account(mut)]
    // /// CHECK: Checked by impact-nft program
    // pub nft_fee_recipient: Option<UncheckedAccount<'info>>,
    // #[account(mut)]
    // /// CHECK: Checked by impact-nft program
    // pub nft_fee_recipient_token_account: Option<Box<Account<'info, TokenAccount>>>
}

pub fn lock_gsol_handler(ctx: Context<LockGSol>, lamports: u64) -> Result<()> {
    transfer_to(
        lamports,
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.source_gsol_account.to_account_info(),
        &ctx.accounts.lock_gsol_account.to_account_info(),
        &ctx.accounts.token_program,
    )?;

    ctx.accounts.lock_account.start_epoch = Some(ctx.accounts.clock.epoch);
    ctx.accounts.lock_account.updated_to_epoch = Some(ctx.accounts.clock.epoch);
    ctx.accounts.lock_account.sunrise_yield_at_start =
        ctx.accounts.epoch_report_account.all_extractable_yield();

    msg!("Minting NFT on impact nft program");
    let state_address = ctx.accounts.state.key();
    let mint_authority_seeds = &[
        state_address.as_ref(),
        IMPACT_NFT_MINT_AUTHORITY,
        &[ctx.bumps.nft_mint_authority],
    ];
    let mint_seeds = &[
        state_address.as_ref(),
        IMPACT_NFT_MINT_ACCOUNT,
        ctx.accounts.authority.key.as_ref(),
        &[ctx.bumps.nft_mint],
    ];
    let pda_signer = &[&mint_authority_seeds[..], &mint_seeds[..]];

    // Mint NFT if not present
    if *ctx.accounts.nft_holder_token_account.owner != ctx.accounts.token_program.key() {
        let cpi_accounts = MintNft {
            payer: ctx.accounts.payer.to_account_info(),
            admin_mint_authority: ctx.accounts.nft_mint_authority.to_account_info(),
            token_authority: ctx.accounts.nft_token_authority.to_account_info(),
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
            collection_mint: ctx.accounts.nft_collection_mint.to_account_info(),
            collection_metadata: ctx.accounts.nft_collection_metadata.to_account_info(),
            collection_master_edition: ctx.accounts.nft_collection_master_edition.to_account_info(),
            // anchor_gen does not allow optional accounts at the moment, so we have disabled fees
            // payer_token_account: ctx.accounts.nft_fee_payer_token_account.map(|a| a.to_account_info()),
            // recipient: ctx.accounts.nft_fee_recipient.to_account_info(),
            // recipient_token_account: ctx.accounts.nft_fee_recipient_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.impact_nft_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(pda_signer);

        cpi_mint_nft(cpi_ctx, 0, lamports)?;
    } else {
        msg!("NFT already minted");
    }

    Ok(())
}
