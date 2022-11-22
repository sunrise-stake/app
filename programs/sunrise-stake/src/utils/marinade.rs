use crate::utils::calc::proportional;
use crate::utils::seeds::MSOL_ACCOUNT;
use crate::{Deposit, LiquidUnstake, State, WithdrawToTreasury};
use anchor_lang::context::CpiContext;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::cpi::accounts::{
    Deposit as MarinadeDeposit, LiquidUnstake as MarinadeLiquidUnstake,
};
use marinade_cpi::cpi::{deposit as marinade_deposit, liquid_unstake as marinade_liquid_unstake};
use marinade_cpi::program::MarinadeFinance;
use marinade_cpi::State as MarinadeState;

pub struct GenericUnstakeProperties<'info> {
    state: Box<Account<'info, State>>,
    marinade_state: Box<Account<'info, MarinadeState>>,
    msol_mint: Account<'info, Mint>,
    /// CHECK: Checked in marinade program
    liq_pool_sol_leg_pda: AccountInfo<'info>,
    liq_pool_msol_leg: Account<'info, TokenAccount>,
    /// CHECK: Checked in marinade program
    treasury_msol_account: AccountInfo<'info>,
    get_msol_from: Account<'info, TokenAccount>,
    get_msol_from_authority: SystemAccount<'info>,
    /// CHECK: Set by the calling function
    recipient: AccountInfo<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    marinade_program: Program<'info, MarinadeFinance>,
}
impl<'a> From<LiquidUnstake<'a>> for GenericUnstakeProperties<'a> {
    fn from(unstake: LiquidUnstake<'a>) -> Self {
        Self {
            state: unstake.state,
            marinade_state: unstake.marinade_state,
            msol_mint: unstake.msol_mint,
            liq_pool_sol_leg_pda: unstake.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: unstake.liq_pool_msol_leg,
            treasury_msol_account: unstake.treasury_msol_account,
            get_msol_from: unstake.get_msol_from,
            get_msol_from_authority: unstake.get_msol_from_authority,
            recipient: unstake.gsol_token_account_authority.to_account_info(),
            system_program: unstake.system_program,
            token_program: unstake.token_program,
            marinade_program: unstake.marinade_program,
        }
    }
}
impl<'a> From<&LiquidUnstake<'a>> for GenericUnstakeProperties<'a> {
    fn from(unstake: &LiquidUnstake<'a>) -> Self {
        unstake.to_owned().into()
    }
}
impl<'a> From<WithdrawToTreasury<'a>> for GenericUnstakeProperties<'a> {
    fn from(withdraw_to_treasury: WithdrawToTreasury<'a>) -> Self {
        Self {
            state: withdraw_to_treasury.state,
            marinade_state: withdraw_to_treasury.marinade_state,
            msol_mint: withdraw_to_treasury.msol_mint,
            liq_pool_sol_leg_pda: withdraw_to_treasury.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: withdraw_to_treasury.liq_pool_msol_leg,
            treasury_msol_account: withdraw_to_treasury.treasury_msol_account,
            get_msol_from: withdraw_to_treasury.get_msol_from,
            get_msol_from_authority: withdraw_to_treasury.get_msol_from_authority,
            recipient: withdraw_to_treasury.treasury.to_account_info(),
            system_program: withdraw_to_treasury.system_program,
            token_program: withdraw_to_treasury.token_program,
            marinade_program: withdraw_to_treasury.marinade_program,
        }
    }
}
impl<'a> From<&WithdrawToTreasury<'a>> for GenericUnstakeProperties<'a> {
    fn from(withdraw_to_treasury: &WithdrawToTreasury<'a>) -> Self {
        withdraw_to_treasury.to_owned().into()
    }
}

pub fn deposit(accounts: &Deposit, lamports: u64) -> Result<()> {
    let cpi_program = accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeDeposit {
        state: accounts.marinade_state.to_account_info(),
        msol_mint: accounts.msol_mint.to_account_info(),
        liq_pool_sol_leg_pda: accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: accounts.liq_pool_msol_leg.to_account_info(),
        liq_pool_msol_leg_authority: accounts.liq_pool_msol_leg_authority.to_account_info(),
        reserve_pda: accounts.reserve_pda.to_account_info(),
        transfer_from: accounts.transfer_from.to_account_info(),
        mint_to: accounts.mint_msol_to.to_account_info(),
        msol_mint_authority: accounts.msol_mint_authority.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        token_program: accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    marinade_deposit(cpi_ctx, lamports)
}

pub fn unstake(accounts: &GenericUnstakeProperties, msol_lamports: u64) -> Result<()> {
    let cpi_program = accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeLiquidUnstake {
        state: accounts.marinade_state.to_account_info(),
        msol_mint: accounts.msol_mint.to_account_info(),
        liq_pool_sol_leg_pda: accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: accounts.liq_pool_msol_leg.to_account_info(),
        treasury_msol_account: accounts.treasury_msol_account.to_account_info(),
        get_msol_from: accounts.get_msol_from.to_account_info(),
        get_msol_from_authority: accounts.get_msol_from_authority.to_account_info(),
        transfer_sol_to: accounts.recipient.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        token_program: accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    msg!("Unstake CPI");
    let bump = &[accounts.state.msol_authority_bump][..];
    let state_address = accounts.state.key();
    let seeds = &[state_address.as_ref(), MSOL_ACCOUNT, bump][..];
    msg!("recipient: {}", accounts.recipient.key());
    marinade_liquid_unstake(cpi_ctx.with_signer(&[seeds]), msol_lamports)
}

/// All copied from https://github.com/marinade-finance/liquid-staking-program/blob/447f9607a8c755cac7ad63223febf047142c6c8f/programs/marinade-finance/src/state.rs#L227
fn total_cooling_down(marinade_state: &MarinadeState) -> u64 {
    marinade_state
        .stake_system
        .delayed_unstake_cooling_down
        .checked_add(marinade_state.emergency_cooling_down)
        .expect("Total cooling down overflow")
}

fn total_lamports_under_control(marinade_state: &MarinadeState) -> u64 {
    marinade_state
        .validator_system
        .total_active_balance
        .checked_add(total_cooling_down(marinade_state))
        .expect("Stake balance overflow")
        .checked_add(marinade_state.available_reserve_balance) // reserve_pda.lamports() - self.rent_exempt_for_token_acc
        .expect("Total SOLs under control overflow")
}

fn total_virtual_staked_lamports(marinade_state: &MarinadeState) -> u64 {
    // if we get slashed it may be negative but we must use 0 instead
    total_lamports_under_control(marinade_state)
        .saturating_sub(marinade_state.circulating_ticket_balance) //tickets created -> cooling down lamports or lamports already in reserve and not claimed yet
}

pub fn calc_msol_from_lamports(marinade_state: &MarinadeState, stake_lamports: u64) -> Result<u64> {
    proportional(
        stake_lamports,
        marinade_state.msol_supply,
        total_virtual_staked_lamports(marinade_state),
    )
}

/// Calculate the current recoverable yield (in msol) from marinade.
/// Recoverable yield is defined as the msol in the account that is not matched by minted gsol
pub fn recoverable_yield<'a>(
    marinade_state: &MarinadeState,
    msol_token_account: &Account<'a, TokenAccount>,
    gsol_mint: &Account<'a, Mint>,
) -> Result<u64> {
    // The amount of msol in the shared account - represents the total proportion
    // of the marinade stake pool owned by this SunshineStake instance
    let msol_balance = msol_token_account.amount;
    // The amount of issued gsol - represents the total SOL staked by users
    let gsol_supply = gsol_mint.supply;
    // The msol value of the total SOL staked
    let gsol_supply_in_msol = calc_msol_from_lamports(marinade_state, gsol_supply)?;

    // The amount of msol in the shared account that is not matched by minted gsol
    let recoverable_msol = msol_balance - gsol_supply_in_msol;

    // TODO Remove when no longer debugging
    msg!("msol_balance: {}", msol_balance);
    msg!("gsol_supply: {}", gsol_supply);
    msg!("gsol_supply_in_msol: {}", gsol_supply_in_msol);
    msg!("recoverable_msol: {}", recoverable_msol);

    Ok(recoverable_msol)
}
