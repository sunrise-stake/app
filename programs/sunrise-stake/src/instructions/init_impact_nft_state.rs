use crate::state::{State};
use impact_nft_cpi::program::ImpactNft;
use anchor_lang::prelude::*;
use impact_nft_cpi::GlobalStateInput;
use impact_nft_cpi::cpi::create_global_state;
use impact_nft_cpi::cpi::accounts::CreateGlobalState;

#[derive(Accounts, Clone)]
pub struct InitImpactNftState<'info> {
    #[account(
        has_one = update_authority,
    )]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)] // TODO remove mut once we can add payer to the CreateGlobalState accounts below
    pub update_authority: Signer<'info>,

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
    let input: GlobalStateInput = GlobalStateInput {
        authority: ctx.accounts.update_authority.key(),
        levels,
    };
    let cpi_program = ctx.accounts.impact_nft_program.to_account_info();
    let cpi_accounts = CreateGlobalState {
        payer: ctx.accounts.payer.to_account_info(),
        authority: ctx.accounts.update_authority.to_account_info(),
        global_state: ctx.accounts.impact_nft_state.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    create_global_state(cpi_ctx, input)
}
