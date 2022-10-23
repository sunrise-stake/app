use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token};
use anchor_spl::associated_token::{AssociatedToken, Create};
use marinade_cpi::State;
use marinade_cpi::cpi::{deposit as marinade_deposit, liquid_unstake as marinade_liquid_unstake};
use marinade_cpi::cpi::accounts::{ Deposit as MarinadeDeposit, LiquidUnstake as MarinadeLiquidUnstake };
use marinade_cpi::program::MarinadeFinance;

declare_id!("gskJo33NME4sUk1PzcAt6XDWEwAPfmwsTawJv4iiV4d");

pub const MSOL_ACCOUNT: &'static [u8] = b"msol_account";

#[program]
pub mod green_stake {
    use super::*;

    pub fn create_token_account(ctx: Context<CreateTokenAccount>) -> Result<()> {
        msg!("Creating token account");
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
            state: ctx.accounts.state.to_account_info(),
            msol_mint: ctx.accounts.msol_mint.to_account_info(),
            liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
            liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
            liq_pool_msol_leg_authority: ctx.accounts.liq_pool_msol_leg_authority.to_account_info(),
            reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
            transfer_from: ctx.accounts.transfer_from.to_account_info(),
            mint_to: ctx.accounts.mint_to.to_account_info(),
            msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        msg!("CPI");
        marinade_deposit(cpi_ctx, lamports)
    }

    pub fn liquid_unstake(ctx: Context<LiquidUnstake>, lamports: u64, get_msol_from_authority_bump: u8) -> Result<()> {
        msg!("Unstaking");
        let cpi_program = ctx.accounts.marinade_program.to_account_info();
        let cpi_accounts = MarinadeLiquidUnstake {
            state: ctx.accounts.state.to_account_info(),
            msol_mint: ctx.accounts.msol_mint.to_account_info(),
            liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
            liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
            treasury_msol_account: ctx.accounts.treasury_msol_account.to_account_info(),
            get_msol_from: ctx.accounts.get_msol_from.to_account_info(),
            get_msol_from_authority: ctx.accounts.get_msol_from_authority.to_account_info(),
            transfer_sol_to: ctx.accounts.transfer_sol_to.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        msg!("CPI");

        let bump = &[get_msol_from_authority_bump][..];
        let authority = ctx.accounts.transfer_sol_to.to_account_info().key.to_bytes();
        let seeds = &[
            &b"msol_account"[..],
            &authority[..],
            &bump
        ][..];
        marinade_liquid_unstake(cpi_ctx.with_signer(&[seeds]), lamports)
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub msol_mint: Account<'info, Mint>,

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
    pub mint_to: Account<'info, TokenAccount>,

    /// CHECK: Checked in marinade program
    pub msol_mint_authority: AccountInfo<'info>,

    #[account(
        seeds = [MSOL_ACCOUNT, transfer_from.key().as_ref()],
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
    #[account(mut)]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    pub msol_mint: Account<'info, Mint>,

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

    #[account(mut)]
    /// CHECK: Checked in marinade program
    pub transfer_sol_to: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[derive(Accounts)]
pub struct CreateTokenAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,

    #[account(
        seeds = [MSOL_ACCOUNT, authority.key().as_ref()],
        bump
    )]
    pub msol_token_account_authority: SystemAccount<'info>,
    pub msol_mint: Account<'info, Mint>,

    // #[account(
    //     init,
    //     seeds = [
    //         msol_token_account_authority.key().as_ref(),
    //         token_program.key().as_ref(),
    //         msol_mint.key().as_ref(),
    //         associated_token_program.key().as_ref()
    //     ],
    //     bump,
    //     payer = payer,
    //     token::mint = msol_mint,
    //     token::authority = msol_token_account_authority,
    // )]
    // pub msol_token_account: Account<'info, TokenAccount>,
    /// CHECK: Checked by the AssociatedTokenAccount program
    #[account(mut)]
    pub msol_token_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}
