mod utils;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, TokenAccount, Token};
use anchor_spl::associated_token::{AssociatedToken, Create};
use marinade_cpi::{State as MarinadeState};
use marinade_cpi::cpi::{deposit as marinade_deposit, liquid_unstake as marinade_liquid_unstake};
use marinade_cpi::cpi::accounts::{ Deposit as MarinadeDeposit, LiquidUnstake as MarinadeLiquidUnstake };
use marinade_cpi::program::MarinadeFinance;
use crate::utils::token::{create_mint, mint_to};
use crate::utils::seeds::*;

declare_id!("gStMmPPFUGhmyQE8r895q28JVW9JkvDepNu2hTg1f4p");

#[program]
pub mod green_stake {
    use anchor_lang::solana_program::program::invoke;
    use anchor_lang::solana_program::system_instruction::transfer;
    use crate::utils::token::burn;
    use super::*;

    pub fn register_state(ctx: Context<RegisterState>, state: StateInput) -> Result<()> {
        let state_account = &mut ctx.accounts.state;
        state_account.marinade_state = state.marinade_state;
        state_account.update_authority = state.update_authority;
        state_account.gsol_mint = state.gsol_mint;
        state_account.gsol_mint_authority_bump = state.gsol_mint_authority_bump;
        state_account.treasury = state.treasury;

        let mint_authority = Pubkey::create_program_address(
            &[
                &state_account.key().to_bytes(),
                GSOL_MINT_AUTHORITY,
                &[state_account.gsol_mint_authority_bump],
            ],
            ctx.program_id,
        ).unwrap();

        create_mint(
            &ctx.accounts.payer.to_account_info(),
            &ctx.accounts.mint.to_account_info(),
            &mint_authority,
            &ctx.accounts.system_program.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.rent.to_account_info())?;

        Ok(())
    }

    pub fn create_msol_token_account(ctx: Context<CreateMSolTokenAccount>) -> Result<()> {
        msg!("Creating msol token account");
        let cpi_program = ctx.accounts.associated_token_program.to_account_info();
        let cpi_accounts = Create {
            payer: ctx.accounts.payer.to_account_info(),
            authority: ctx.accounts.msol_token_account_authority.to_account_info(),
            associated_token: ctx.accounts.msol_token_account.to_account_info(),
            mint: ctx.accounts.msol_mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            cpi_program,
            cpi_accounts,
        );
        msg!("CPI");
        anchor_spl::associated_token::create(cpi_ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, lamports: u64) -> Result<()> {
        msg!("Depositing");

        let cpi_program = ctx.accounts.marinade_program.to_account_info();
        let cpi_accounts = MarinadeDeposit {
            state: ctx.accounts.marinade_state.to_account_info(),
            msol_mint: ctx.accounts.msol_mint.to_account_info(),
            liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
            liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
            liq_pool_msol_leg_authority: ctx.accounts.liq_pool_msol_leg_authority.to_account_info(),
            reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
            transfer_from: ctx.accounts.transfer_from.to_account_info(),
            mint_to: ctx.accounts.mint_msol_to.to_account_info(),
            msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        msg!("GreenStake CPI");
        marinade_deposit(cpi_ctx, lamports)?;

        msg!("Mint {} GSOL", lamports);
        mint_to(
            lamports,
                &ctx.accounts.gsol_mint.to_account_info(),
                &ctx.accounts.gsol_mint_authority.to_account_info(),
            &ctx.accounts.mint_gsol_to.to_account_info(),
            &ctx.accounts.token_program.to_account_info(),
            &ctx.accounts.state,
        )
    }

    pub fn liquid_unstake(ctx: Context<LiquidUnstake>, msol_lamports: u64, get_msol_from_authority_bump: u8) -> Result<()> {
        msg!("Unstaking");
        let cpi_program = ctx.accounts.marinade_program.to_account_info();
        let cpi_accounts = MarinadeLiquidUnstake {
            state: ctx.accounts.marinade_state.to_account_info(),
            msol_mint: ctx.accounts.msol_mint.to_account_info(),
            liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
            liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
            treasury_msol_account: ctx.accounts.treasury_msol_account.to_account_info(),
            get_msol_from: ctx.accounts.get_msol_from.to_account_info(),
            get_msol_from_authority: ctx.accounts.get_msol_from_authority.to_account_info(),
            transfer_sol_to: ctx.accounts.gsol_token_account_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        let total_msol_lamports = ctx.accounts.get_msol_from.amount;
        require_eq!(msol_lamports, total_msol_lamports, ErrorCode::ProportionalUnstakeNotSupported); // TODO allow proportional unstake
        let pre_balance = ctx.accounts.gsol_token_account_authority.try_lamports()?;
        msg!("Staker pre balance: {:?}", pre_balance);

        msg!("Unstake CPI");

        let bump = &[get_msol_from_authority_bump][..];
        let state_address = ctx.accounts.state.key();
        let authority = ctx.accounts.gsol_token_account_authority.to_account_info().key.to_bytes();
        let seeds = &[
            state_address.as_ref(),
            MSOL_ACCOUNT,
            &authority[..],
            &bump
        ][..];
        marinade_liquid_unstake(cpi_ctx.with_signer(&[seeds]), msol_lamports)?;

        let staked_lamports = ctx.accounts.gsol_token_account.amount;
        msg!("Staked lamports: {}", staked_lamports);

        msg!("Burn GSol");
        burn(
            staked_lamports,
            &ctx.accounts.gsol_mint.to_account_info(),
            &ctx.accounts.gsol_token_account_authority,
            &ctx.accounts.gsol_token_account.to_account_info(),
            &ctx.accounts.token_program.to_account_info()
        )?;

        let post_balance = ctx.accounts.gsol_token_account_authority.try_lamports()?;
        msg!("Staker post balance: {:?}", post_balance);

        let earned_lamports_opt = (post_balance - pre_balance).checked_sub(staked_lamports);

        match earned_lamports_opt {
            Some(earned_lamports) => {
                msg!("Treasury earned lamports: {:?}", earned_lamports);
                let transfer_instruction = &transfer(
                    &ctx.accounts.gsol_token_account_authority.key(),
                    &ctx.accounts.treasury.key(),
                    earned_lamports,
                );

                invoke(
                    transfer_instruction,
                    &[
                        ctx.accounts.gsol_token_account_authority.to_account_info(),
                        ctx.accounts.treasury.to_account_info(),
                        ctx.accounts.system_program.to_account_info()
                    ]
                )?;
            }
            _ => {
                msg!("No lamports earned for treasury.")
            }
        }

        Ok(())
    }
}

#[account]
pub struct State {
    pub marinade_state: Pubkey,
    pub update_authority: Pubkey,
    pub gsol_mint: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
}
impl State {
    const SPACE: usize = 32 + 32 + 32 + 32 + 1 + 8 /* DISCRIMINATOR */ ;
}

// Matches State above. Used as the input to RegisterState.
// Redefined so that it shows up in the anchor IDL. TODO - is there a better way?
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct StateInput {
    pub marinade_state: Pubkey,
    pub update_authority: Pubkey,
    pub gsol_mint: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
}

#[derive(Accounts)]
pub struct RegisterState<'info> {
    #[account(init, space = State::SPACE, payer = payer)]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account()]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(
        mut,
        constraint = gsol_mint.mint_authority == COption::Some(gsol_mint_authority.key()),
    )]
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(
        seeds = [
            state.key().as_ref(),
            GSOL_MINT_AUTHORITY,
        ],
        bump = state.gsol_mint_authority_bump,
    )]
    pub gsol_mint_authority: SystemAccount<'info>,

    #[account(mut)]
    pub msol_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    #[account(mut)]
    pub liq_pool_msol_leg: Account<'info, TokenAccount>,
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg_authority: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub reserve_pda: AccountInfo<'info>,

    #[account(mut, signer)]
    /// CHECK: Checked in marinade program
    pub transfer_from: AccountInfo<'info>,

    #[account(
        mut,
        token::mint = msol_mint,
        token::authority = msol_token_account_authority,
    )]
    pub mint_msol_to: Account<'info, TokenAccount>,

    #[account(
    mut,
    token::mint = gsol_mint,
    token::authority = transfer_from.key(),
    )]
    pub mint_gsol_to: Account<'info, TokenAccount>,

    /// CHECK: Checked in marinade program
    pub msol_mint_authority: AccountInfo<'info>,

    #[account(
        seeds = [state.key().as_ref(), MSOL_ACCOUNT, transfer_from.key().as_ref()],
        bump
    )]
    /// CHECK: Must be the correct PDA
    pub msol_token_account_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[derive(Accounts)]
pub struct LiquidUnstake<'info> {
    #[account(
        has_one = treasury,
        has_one = marinade_state,
    )]
    pub state: Box<Account<'info, State>>,

    #[account()]
    pub marinade_state: Box<Account<'info, MarinadeState>>,

    #[account(mut)]
    pub msol_mint: Account<'info, Mint>,

    #[account(
        constraint = gsol_mint.mint_authority == COption::Some(gsol_mint_authority.key()),
    )]
    pub gsol_mint: Box<Account<'info, Mint>>,

    #[account(
        seeds = [
        state.key().as_ref(),
        GSOL_MINT_AUTHORITY,
        ],
        bump = state.gsol_mint_authority_bump,
    )]
    /// Used to ensure the correct GSOL mint is used
    pub gsol_mint_authority: SystemAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub liq_pool_msol_leg: Account<'info, TokenAccount>,
    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub treasury_msol_account: AccountInfo<'info>,

    #[account(
        mut,
        token::mint = msol_mint,
        token::authority = get_msol_from_authority,
    )]
    pub get_msol_from: Account<'info, TokenAccount>,

    #[account()]
    /// CHECK: Checked in marinade program
    pub get_msol_from_authority: AccountInfo<'info>, // green-stake PDA

    #[account(
        mut,
        token::authority = gsol_token_account_authority
    )]
    pub gsol_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: Owner of the gsol token account
    pub gsol_token_account_authority: UncheckedAccount<'info>,

    #[account()]
    /// CHECK: Matches state.treasury
    pub treasury: SystemAccount<'info>, // green-stake treasury

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[derive(Accounts)]
pub struct CreateMSolTokenAccount<'info> {
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,

    #[account(
        seeds = [state.key().as_ref(), MSOL_ACCOUNT, authority.key().as_ref()],
        bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,
    pub msol_mint: Account<'info, Mint>,

    /// CHECK: Checked by the AssociatedTokenAccount program
    #[account(mut)]
    pub msol_token_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum ErrorCode {
    // TODO allow proportional unstake
    #[msg("Must unstake full MSOL")]
    ProportionalUnstakeNotSupported,
}