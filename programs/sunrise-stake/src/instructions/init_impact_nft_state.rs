use crate::state::{State};
use crate::utils::seeds::IMPACT_NFT_MINT_AUTHORITY;
use impact_nft_cpi::program::ImpactNft;
use anchor_lang::prelude::*;
use impact_nft_cpi::GlobalStateInput;
use impact_nft_cpi::cpi::{create_global_state, create_offset_tiers};
use impact_nft_cpi::cpi::accounts::{CreateGlobalState, CreateOffsetTiers};

#[derive(Accounts, Clone)]
pub struct InitImpactNftState<'info> {
    #[account(
        has_one = update_authority,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub update_authority: Signer<'info>,

    #[account(
        seeds = [state.key().as_ref(), IMPACT_NFT_MINT_AUTHORITY],
        bump, // TODO Move to state object?
    )]
    pub impact_nft_mint_authority: SystemAccount<'info>,

    /// CHECK: Created by the ImpactNFT program
    #[account(mut)]
    pub offset_tiers: UncheckedAccount<'info>,

    /// CHECK: Created by the ImpactNFT program
    #[account(mut)]
    pub impact_nft_state: UncheckedAccount<'info>,

    pub impact_nft_program: Program<'info, ImpactNft>,
    pub system_program: Program<'info, System>,
}

pub fn init_impact_nft_state_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, InitImpactNftState<'info>>,
    levels: u16,
) -> Result<()> {
    let cpi_program = ctx.accounts.impact_nft_program.to_account_info();

    msg!("Create state object");
    let globalStateInput: GlobalStateInput = GlobalStateInput {
        // THIS IS THE "MINT_AUTHORITY"
        authority: ctx.accounts.impact_nft_mint_authority.key(),
        levels,
    };
    let create_global_state_cpi_accounts = CreateGlobalState {
        payer: ctx.accounts.payer.to_account_info(),
        // THIS IS THE "UPGRADE_AUTHORITY"
        authority: ctx.accounts.update_authority.to_account_info(),
        global_state: ctx.accounts.impact_nft_state.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let create_global_state_cpi_ctx = CpiContext::new(cpi_program.clone(), create_global_state_cpi_accounts);
    create_global_state(create_global_state_cpi_ctx, globalStateInput)?;

    msg!("create tiers");
    let offset_tiers_input = OffsetTiersInput {
        levels,
    };
    let create_tiers_cpi_accounts = CreateOffsetTiers {
        // payer: ctx.accounts.payer.to_account_info(),
        // THIS IS THE "UPGRADE_AUTHORITY"
        offset_tiers: ctx.accounts.offset_tiers.to_account_info(),
        authority: ctx.accounts.update_authority.to_account_info(),
        global_state: ctx.accounts.impact_nft_state.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let create_tiers_cpi_ctx = CpiContext::new(cpi_program, create_tiers_cpi_accounts);
    create_offset_tiers(create_tiers_cpi_ctx, offset_tiers_input)
}
