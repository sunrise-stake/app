use crate::state::State;
use crate::utils::seeds::GSOL_MINT_AUTHORITY;
use anchor_lang::prelude::*;
use anchor_lang::Key;
use anchor_spl::metadata::mpl_token_metadata::types::DataV2;
use anchor_spl::metadata::{create_metadata_accounts_v3, update_metadata_accounts_v2, CreateMetadataAccountsV3, UpdateMetadataAccountsV2};

struct MetadataAccounts<'a> {
    state: Account<'a, State>,
    metadata: AccountInfo<'a>,
    gsol_mint: AccountInfo<'a>,
    gsol_mint_authority: AccountInfo<'a>,
    update_authority: AccountInfo<'a>,
    token_metadata_program: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    rent: AccountInfo<'a>,
}

pub fn create_metadata_account(
    accounts: &MetadataAccounts,
    uri: String,
    name: String,
    symbol: String
) -> Result<()> {
    let state_address = accounts.state.key();
    let seeds = &[
        state_address.as_ref(),
        GSOL_MINT_AUTHORITY,
        &[accounts.state.gsol_mint_authority_bump],
    ];

    let cpi_ctx = CpiContext::new(
        accounts.token_metadata_program.clone(),
        CreateMetadataAccountsV3 {
            metadata: accounts.metadata.clone(),
            mint,
            mint_authority: accounts.update_authority.clone(),
            payer,
            update_authority: accounts.update_authority.clone(),
            system_program,
            rent,
        }
    );
    create_metadata_accounts_v3(
        cpi_ctx.with_signer(&[&seeds]),
        DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        false,
        false,
        None,
    )?;

    Ok(())
}

pub fn update_metadata_account(
    accounts: &MetadataAccounts,
    uri: String,
    name: String,
    symbol: String
) -> Result<()> {
    let state_address = accounts.state.key();
    let seeds = &[
        state_address.as_ref(),
        GSOL_MINT_AUTHORITY,
        &[accounts.state.gsol_mint_authority_bump],
    ];

    let cpi_ctx = CpiContext::new(
        accounts.token_metadata_program.clone(),
        UpdateMetadataAccountsV2 {
            metadata: accounts.metadata.clone(),
            update_authority: accounts.update_authority.clone(),
        }
    );
    update_metadata_accounts_v2(
        cpi_ctx.with_signer(&[&seeds]),
        None,
        Some(DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        }),
        None,
        None,
    )?;

    Ok(())
}
