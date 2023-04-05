use crate::state::CreateMetadata;
use crate::utils::metaplex::create_metadata_account;
use anchor_lang::prelude::*;

// used once to create token metadata for gSOL
pub fn create_metadata_handler(
    ctx: Context<CreateMetadata>,
    uri: String,
    name: String,
    symbol: String,
) -> Result<()> {
    msg!("Create Metadata for gSol");
    create_metadata_account(ctx.accounts, uri, name, symbol)
}
