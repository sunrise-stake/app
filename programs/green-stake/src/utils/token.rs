use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::create_account;
use anchor_spl::token;
use anchor_spl::token::Mint;
use crate::State;
use crate::utils::seeds::GSOL_MINT_AUTHORITY;

pub fn create_mint<'a>(
    payer: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    mint_authority: &Pubkey,
    system_program: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
    rent_sysvar: &AccountInfo<'a>
) -> Result<()> {
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(Mint::LEN);
    invoke(
        &create_account(
            payer.key,
            mint.key,
            lamports,
            Mint::LEN as u64,
            token_program.key,
        ),
        &[
            payer.clone(),
            mint.clone(),
            system_program.clone(),
        ],
    )?;

    let cpi_program = token_program.clone();
    let accounts = token::InitializeMint {
        mint: mint.clone(),
        rent: rent_sysvar.clone(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, accounts);
    token::initialize_mint(
        cpi_ctx,
        9,
        mint_authority,
        Some(mint_authority),
    )
}

pub fn mint_to<'a>(
    amount: u64,
    mint: &AccountInfo<'a>,
    mint_authority: &AccountInfo<'a>,
    recipient_token_account: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
    state: &Account<'a, State>
) -> Result<()> {
    let state_address = state.key();
    let seeds = &[state_address.as_ref(), GSOL_MINT_AUTHORITY, &[state.gsol_mint_authority_bump]];
    let pda_signer = &[&seeds[..]];

    let cpi_program = token_program.clone();
    let accounts = token::MintTo {
        mint: mint.clone(),
        to: recipient_token_account.clone(),
        authority: mint_authority.clone()
    };
    let cpi_ctx = CpiContext::new(cpi_program, accounts).with_signer(pda_signer);
    token::mint_to(
        cpi_ctx,
        amount,
    )
}

pub fn burn<'a>(
    amount: u64,
    mint: &AccountInfo<'a>,
    authority: &AccountInfo<'a>,
    token_account: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
) -> Result<()> {
    let cpi_program = token_program.clone();
    let accounts = token::Burn {
        mint: mint.clone(),
        authority: authority.clone(),
        from: token_account.clone(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, accounts);
    token::burn(
        cpi_ctx,
        amount,
    )
}