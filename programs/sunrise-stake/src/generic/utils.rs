use anchor_lang::prelude::*;
use crate::generic::common::*;
use marinade_cpi::{
    cpi::{
        accounts::{
            AddLiquidity as MarinadeAddLiquidity,
            Deposit as MarinadeDeposit, 
        },
        add_liquidity as marinade_add_liquidity,
        deposit as marinade_deposit,
    },
};
use crate::utils::marinade::{current_liq_pool_balance, calc_lamports_from_msol_amount, preferred_liq_pool_balance};
use crate::utils::spl;

pub fn deposit<'info>(
    marinade_accounts: &MarinadeAccounts<'info>, 
    sunrise_accounts: &SharedAccounts<'info>, 
    transfer_from: &AccountInfo<'info>, 
    lamports: u64) -> Result<()> {
    let cpi_program = marinade_accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeDeposit {
        state: marinade_accounts.marinade_state.to_account_info(),
        msol_mint: marinade_accounts.msol_mint.to_account_info(),
        liq_pool_sol_leg_pda: marinade_accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: marinade_accounts.liq_pool_msol_leg_account.to_account_info(),
        liq_pool_msol_leg_authority: marinade_accounts.liq_pool_msol_leg_authority.to_account_info(),
        reserve_pda: marinade_accounts.reserve_pda.to_account_info(),
        transfer_from: transfer_from.to_owned(),
        mint_to: marinade_accounts.sunrise_msol_token_account.to_account_info(),
        msol_mint_authority: marinade_accounts.msol_mint_authority.clone(),
        system_program: sunrise_accounts.system_program.to_account_info(),
        token_program: sunrise_accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    marinade_deposit(cpi_ctx, lamports)
}


#[inline(never)]
fn create_add_liquidity_ctx<'a, 'b, 'c, 'info>(
    marinade_accounts: &'a MarinadeAccounts<'info>,
    sunrise_accounts: &'a SharedAccounts<'info>,
    transfer_from: &AccountInfo<'info>,
) -> CpiContext<'a, 'b, 'c, 'info, MarinadeAddLiquidity<'info>> {
    let cpi_program = marinade_accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeAddLiquidity {
        state: marinade_accounts.marinade_state.to_account_info(),
        lp_mint: marinade_accounts.liq_pool_mint.to_account_info(),
        liq_pool_sol_leg_pda: marinade_accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: marinade_accounts.liq_pool_msol_leg_account.to_account_info(),
        transfer_from: transfer_from.to_owned(),
        mint_to: marinade_accounts.sunrise_liq_pool_token_account.to_account_info(),
        lp_mint_authority: marinade_accounts.liq_pool_mint_authority.to_account_info(),
        system_program: sunrise_accounts.system_program.to_account_info(),
        token_program: sunrise_accounts.token_program.to_account_info(),
    };
    CpiContext::new(cpi_program, cpi_accounts)
}

#[inline(never)]
pub fn add_liquidity<'info>(
    marinade_accounts: &MarinadeAccounts<'info>, 
    sunrise_accounts: &SharedAccounts<'info>,
    transfer_from: &AccountInfo<'info>,
    lamports: u64
) -> Result<()> {
    let cpi_ctx = create_add_liquidity_ctx(marinade_accounts, sunrise_accounts, transfer_from);
    marinade_add_liquidity(cpi_ctx, lamports)
}


#[inline(never)]
pub fn calculate_sol_value_shares(
    spl_accounts: &Vec<Box<SplAccounts>>,
    marinade_accounts: &MarinadeAccounts,
) -> Result<SolValueShares> {
    let mut spl_pool_values = Vec::new();

    for account in spl_accounts {
        let stake_pool = &account.pool.value;
        let balance = account.sunrise_pool_mint_token_account.amount;
        let stake_pool_value = spl::calc_lamports_from_bsol_amount(&stake_pool, balance)?;
        spl_pool_values.push(stake_pool_value);
    }

    let liquidity_pool_balance = current_liq_pool_balance(
        &marinade_accounts.marinade_state,
        &marinade_accounts.liq_pool_mint,
        &marinade_accounts.sunrise_liq_pool_token_account,
        &marinade_accounts.liq_pool_sol_leg_pda,
        &marinade_accounts.liq_pool_msol_leg_account,
    )?;

    // Calculate the sol value of all msol + lp tokens held by this sunrise instance
    let lp_value = liquidity_pool_balance.sol_value(&marinade_accounts.marinade_state);
    let msol_value =
        calc_lamports_from_msol_amount(&marinade_accounts.marinade_state, marinade_accounts.sunrise_msol_token_account.amount)?;

    let total_spl_value = spl_pool_values.clone().into_iter().reduce(|acc, value| acc.checked_add(value).unwrap()).unwrap();
    
    let total_value_staked = lp_value
        .checked_add(msol_value)
        .unwrap()
        .checked_add(total_spl_value)
        .expect("total_staked_value");

    Ok( SolValueShares {
        lp_value,
        msol_value,
        spl_pool_values,
        total_spl_value,
        total_value_staked
    })
}

#[inline(never)]
pub fn amount_to_be_deposited_in_liq_pool(marinade_accounts: &MarinadeAccounts, sunrise_accounts: &SharedAccounts, lamports: u64) -> Result<u64> {
    let liq_pool_balance = current_liq_pool_balance(
        &marinade_accounts.marinade_state,
        &marinade_accounts.liq_pool_mint,
        &marinade_accounts.sunrise_liq_pool_token_account,
        &marinade_accounts.liq_pool_sol_leg_pda,
        &marinade_accounts.liq_pool_msol_leg_account,
    )?;
    let preferred_balance =
        preferred_liq_pool_balance(&sunrise_accounts.state, &sunrise_accounts.gsol_mint, lamports)?;

    // if the preferred balance is less than the actual current balance, then we don't need to deposit
    // any more. Return 0.
    // This can happen if the value of the liquidity pool rises, via yield accrued through fees.
    let liq_pool_value = liq_pool_balance.sol_value(&marinade_accounts.marinade_state);
    let missing_balance = preferred_balance.saturating_sub(liq_pool_value);
    let amount_to_be_deposited = lamports.min(missing_balance);
    msg!(
        "liq_pool_balance value:{:?}, preferred_liq_pool_balance value:{}, missing_balance:{}, amount_to_be_deposited:{}",
        liq_pool_value,
        preferred_balance,
        missing_balance,
        amount_to_be_deposited
    );
    Ok(amount_to_be_deposited)
}
