use crate::state::CreateMetadata;
use crate::utils::metaplex::{create_metadata_account, MetadataAccounts};
use anchor_lang::prelude::*;

// used once to create token metadata for gSOL
pub fn create_metadata_handler(
    ctx: Context<CreateMetadata>,
    uri: String,
    name: String,
    symbol: String,
) -> Result<()> {
    msg!("Create Metadata for gSol");
    let metadata_accounts = MetadataAccounts {
        state: *ctx.accounts.state.clone(),
        metadata: ctx.accounts.metadata.clone(),
        gsol_mint: ctx.accounts.gsol_mint.to_account_info(),
        update_authority: ctx.accounts.update_authority.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.clone(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    create_metadata_account(&metadata_accounts, uri, name, symbol)
}
