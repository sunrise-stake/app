use crate::state::CreateMetadata;
use crate::utils::metaplex::update_metadata_account;
use anchor_lang::prelude::*;

// used once to create token metadata for gSOL
pub fn update_metadata_handler(
    ctx: Context<CreateMetadata>,
    uri: String,
    name: String,
    symbol: String,
) -> Result<()> {
    msg!("Update Metadata for gSol");
    update_metadata_account(ctx.accounts, uri, name, symbol)
}
