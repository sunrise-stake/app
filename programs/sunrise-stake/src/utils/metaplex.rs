use crate::utils::seeds::GSOL_MINT_AUTHORITY;
use crate::CreateMetadata;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use mpl_token_metadata::{
    instruction::{create_metadata_accounts_v3, update_metadata_accounts_v2},
    state::DataV2,
};

pub fn create_metadata_account(
    accounts: &CreateMetadata,
    uri: String,
    name: String,
    symbol: String,
) -> Result<()> {
    let state_address = accounts.state.key();
    let seeds = &[
        state_address.as_ref(),
        GSOL_MINT_AUTHORITY,
        &[accounts.state.gsol_mint_authority_bump],
    ];
    let pda_signer = &[&seeds[..]];

    let account_info = vec![
        accounts.metadata.to_account_info(),
        accounts.gsol_mint.to_account_info(),
        accounts.gsol_mint_authority.to_account_info(),
        accounts.update_authority.to_account_info(), // payer
        accounts.gsol_mint_authority.to_account_info(), // update authority of metadata account
        accounts.system_program.to_account_info(),
        accounts.rent.to_account_info(),
    ];

    invoke_signed(
        &create_metadata_accounts_v3(
            accounts.token_metadata_program.key(),
            accounts.metadata.key(),
            accounts.gsol_mint.key(),
            accounts.gsol_mint_authority.key(),
            accounts.update_authority.key(),    // payer
            accounts.gsol_mint_authority.key(), // the mint and update authority of the token are the same
            name,
            symbol,
            uri,
            None,
            0,
            true,
            true,
            None,
            None,
            None,
        ),
        account_info.as_slice(),
        pda_signer,
    )?;

    Ok(())
}

pub fn update_metadata_account(
    accounts: &CreateMetadata,
    uri: String,
    name: String,
    symbol: String,
) -> Result<()> {
    let state_address = accounts.state.key();
    let seeds = &[
        state_address.as_ref(),
        GSOL_MINT_AUTHORITY,
        &[accounts.state.gsol_mint_authority_bump],
    ];
    let pda_signer = &[&seeds[..]];

    let account_info = vec![
        accounts.metadata.to_account_info(),            // payer
        accounts.gsol_mint_authority.to_account_info(), // update authority of metadata account
    ];

    let token_metadata = DataV2 {
        name,
        symbol,
        uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    invoke_signed(
        &update_metadata_accounts_v2(
            accounts.token_metadata_program.key(),
            accounts.metadata.key(),
            accounts.gsol_mint_authority.key(),
            Some(accounts.gsol_mint_authority.key()),
            Some(token_metadata),
            None,
            Some(true),
        ),
        account_info.as_slice(),
        pda_signer,
    )?;

    Ok(())
}
