use crate::utils::seeds::GSOL_MINT_AUTHORITY;
use crate::State;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::create_account;
use anchor_spl::associated_token::{AssociatedToken, Create};
use anchor_spl::token;
use anchor_spl::token::{Mint, Token};

pub fn create_mint<'a>(
    payer: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    mint_authority: &Pubkey,
    system_program: &Program<'a, System>,
    token_program: &Program<'a, Token>,
    rent_sysvar: &AccountInfo<'a>,
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
            system_program.to_account_info().clone(),
        ],
    )?;

    let accounts = token::InitializeMint {
        mint: mint.clone(),
        rent: rent_sysvar.clone(),
    };
    let cpi_ctx = CpiContext::new(token_program.to_account_info(), accounts);
    token::initialize_mint(cpi_ctx, 9, mint_authority, Some(mint_authority))
}

#[allow(clippy::too_many_arguments)]
pub fn create_token_account<'a>(
    payer: &Signer<'a>,
    token_account: &AccountInfo<'a>,
    mint: &Account<'a, Mint>,
    authority: &AccountInfo<'a>,
    system_program: &Program<'a, System>,
    token_program: &Program<'a, Token>,
    associated_token_program: &Program<'a, AssociatedToken>,
) -> Result<()> {
    let cpi_program = associated_token_program.to_account_info();
    let cpi_accounts = Create {
        payer: payer.to_account_info(),
        authority: authority.to_account_info(),
        associated_token: token_account.clone(),
        mint: mint.to_account_info(),
        system_program: system_program.to_account_info(),
        token_program: token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::associated_token::create(cpi_ctx)
}

pub fn mint_to<'a>(
    amount: u64,
    mint: &AccountInfo<'a>,
    mint_authority: &AccountInfo<'a>,
    recipient_token_account: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
    state: &Account<'a, State>,
) -> Result<()> {
    let state_address = state.key();
    let seeds = &[
        state_address.as_ref(),
        GSOL_MINT_AUTHORITY,
        &[state.gsol_mint_authority_bump],
    ];
    let pda_signer = &[&seeds[..]];

    let cpi_program = token_program.clone();
    let accounts = token::MintTo {
        mint: mint.clone(),
        to: recipient_token_account.clone(),
        authority: mint_authority.clone(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, accounts).with_signer(pda_signer);
    token::mint_to(cpi_ctx, amount)
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
    token::burn(cpi_ctx, amount)
}

pub fn transfer_to<'a>(
    amount: u64,
    authority: &AccountInfo<'a>,
    source_token_account: &AccountInfo<'a>,
    recipient_token_account: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
) -> Result<()> {
    let cpi_program = token_program.clone();
    let accounts = token::Transfer {
        from: source_token_account.clone(),
        to: recipient_token_account.clone(),
        authority: authority.clone(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, accounts);
    token::transfer(cpi_ctx, amount)
}

#[allow(clippy::too_many_arguments)]
pub fn transfer_to_signed<'a>(
    amount: u64,
    authority: &AccountInfo<'a>,
    source_token_account: &AccountInfo<'a>,
    recipient: &AccountInfo<'a>,
    recipient_token_account: &AccountInfo<'a>,
    token_program: &AccountInfo<'a>,
    state: &Account<'a, State>,
    seed: &[u8],
    authority_pda_bump: u8,
) -> Result<()> {
    let state_address = state.key();
    let seeds = &[
        state_address.as_ref(),
        seed,
        recipient.key.as_ref(),
        &[authority_pda_bump],
    ];
    let pda_signer = &[&seeds[..]];

    let cpi_program = token_program.clone();
    let accounts = token::Transfer {
        from: source_token_account.clone(),
        to: recipient_token_account.clone(),
        authority: authority.clone(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, accounts).with_signer(pda_signer);
    token::transfer(cpi_ctx, amount)
}
