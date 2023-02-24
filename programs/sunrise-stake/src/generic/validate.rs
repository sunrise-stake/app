use super::common::*;
use crate::{utils::seeds, State};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::account_info::next_account_info;
use anchor_spl::token::{Mint, TokenAccount};
use marinade_cpi::State as MarinadeState;

#[inline(never)]
pub fn validate_spl_accounts<'c, 'info, T, U>(
    ctx: &Context<'_, '_, 'c, 'info, T>,
    stake_pool_program: &AccountInfo<'info>,
    manager: &Account<'info, Manager>,
    start_index: usize,
    end_index: usize,
) -> Result<Box<U>>
where
    T: Accounts<'info>,
    U: From<SplAccounts<'info>>,
{
    msg!(
        "Validating spl accounts from index [{}] to [{}]",
        start_index,
        end_index
    );
    let range = start_index..end_index;
    let accounts_to_check = &ctx.remaining_accounts[range];

    let accounts_iter = &mut accounts_to_check.iter();

    let pool_account = next_account_info(accounts_iter)?;
    assert!(manager.spl_pools.contains(pool_account.key));
    let pool_account = Account::<'info, SplWrapper>::try_from(pool_account)?;
    let pool_mint_account = next_account_info(accounts_iter)?;
    let pool_mint = Account::<'info, Mint>::try_from(pool_mint_account)?;
    let manager_fee_account = next_account_info(accounts_iter)?;
    let reserve_stake_account = next_account_info(accounts_iter)?;
    let validator_list = next_account_info(accounts_iter)?;
    let pool_deposit_authority = next_account_info(accounts_iter)?;
    let pool_withdraw_authority = next_account_info(accounts_iter)?;
    let sunrise_pool_mint_token_account = next_account_info(accounts_iter)?;
    let sunrise_pool_mint_token_account =
        Account::<'info, TokenAccount>::try_from(sunrise_pool_mint_token_account)?;
    let token_account_authority = next_account_info(accounts_iter)?;
    require_keys_eq!(
        token_account_authority.key(),
        manager.generic_token_account_auth
    );
    require_keys_eq!(
        sunrise_pool_mint_token_account.owner,
        token_account_authority.key()
    );

    let spl_accounts: Box<U> = Box::new(
        SplAccounts {
            pool: pool_account,
            pool_mint,
            manager_fee_account: manager_fee_account.clone(),
            reserve_stake_account: reserve_stake_account.clone(),
            validator_list: validator_list.clone(),
            pool_deposit_authority: pool_deposit_authority.clone(),
            pool_withdraw_authority: pool_withdraw_authority.clone(),
            sunrise_pool_mint_token_account,
            token_account_authority: token_account_authority.clone(),
            stake_pool_program: stake_pool_program.clone(),
        }
        .into(),
    );

    Ok(spl_accounts)
}

#[inline(never)]
pub fn validate_marinade_accounts<'c, 'info, T, U>(
    ctx: &Context<'_, '_, 'c, 'info, T>,
    state: &Account<'info, State>,
    marinade_program: AccountInfo<'info>,
    start_index: usize,
    end_index: usize,
) -> Result<Box<U>>
where
    T: Accounts<'info>,
    U: From<MarinadeAccounts<'info>>,
{
    msg!(
        "Validating marinade accounts from index [{}] to [{}]",
        start_index,
        end_index
    );

    let range = start_index..end_index;
    let accounts_to_check = &ctx.remaining_accounts[range];

    let accounts_iter = &mut accounts_to_check.iter();
    let marinade_state = next_account_info(accounts_iter)?;
    require_keys_eq!(marinade_state.key(), state.marinade_state);
    let marinade_state_account =
        Box::new(Account::<'info, MarinadeState>::try_from(marinade_state)?);
    let msol_mint = next_account_info(accounts_iter)?;
    require_keys_eq!(marinade_state_account.msol_mint, msol_mint.key());
    let liq_pool_mint = next_account_info(accounts_iter)?;
    let liq_pool_mint_account = Box::new(Account::<'info, Mint>::try_from(liq_pool_mint)?);
    let liq_pool_sol_leg_pda = next_account_info(accounts_iter)?;
    let liq_pool_msol_leg_account = next_account_info(accounts_iter)?;
    let liq_pool_msol_leg_account = Box::new(Account::<'info, TokenAccount>::try_from(
        liq_pool_msol_leg_account,
    )?);
    let liq_pool_msol_leg_authority = next_account_info(accounts_iter)?;
    let liq_pool_mint_authority = next_account_info(accounts_iter)?;
    let treasury_msol_account = next_account_info(accounts_iter)?;
    let reserve_pda = next_account_info(accounts_iter)?;
    let msol_mint_authority = next_account_info(accounts_iter)?;
    let sunrise_msol_token_account = next_account_info(accounts_iter)?;
    let sunrise_msol_token_account = Box::new(Account::<'info, TokenAccount>::try_from(
        sunrise_msol_token_account,
    )?);
    let sunrise_liq_pool_token_account = next_account_info(accounts_iter)?;
    let sunrise_liq_pool_token_account = Box::new(Account::<'info, TokenAccount>::try_from(
        sunrise_liq_pool_token_account,
    )?);
    let sunrise_msol_account_authority = next_account_info(accounts_iter)?;
    require_keys_eq!(
        sunrise_msol_token_account.owner,
        sunrise_msol_account_authority.key()
    );
    require_keys_eq!(sunrise_msol_token_account.mint, msol_mint.key());
    require_keys_eq!(
        sunrise_liq_pool_token_account.owner,
        sunrise_msol_account_authority.key()
    );
    require_keys_eq!(
        sunrise_liq_pool_token_account.mint,
        marinade_state_account.liq_pool.lp_mint
    );

    let (pda, bump) =
        Pubkey::find_program_address(&[state.key().as_ref(), seeds::MSOL_ACCOUNT], &crate::ID);
    require_keys_eq!(pda, sunrise_msol_account_authority.key());
    require_eq!(bump, state.msol_authority_bump);

    let marinade_accounts: Box<U> = Box::new(
        MarinadeAccounts {
            marinade_state: *marinade_state_account,
            msol_mint: msol_mint.clone(),
            liq_pool_mint: *liq_pool_mint_account,
            liq_pool_sol_leg_pda: liq_pool_sol_leg_pda.clone(),
            liq_pool_msol_leg_account: *liq_pool_msol_leg_account,
            liq_pool_msol_leg_authority: liq_pool_msol_leg_authority.clone(),
            liq_pool_mint_authority: liq_pool_mint_authority.clone(),
            treasury_msol_account: treasury_msol_account.clone(),
            reserve_pda: reserve_pda.clone(),
            msol_mint_authority: msol_mint_authority.clone(),
            sunrise_msol_token_account: *sunrise_msol_token_account,
            sunrise_liq_pool_token_account: *sunrise_liq_pool_token_account,
            sunrise_msol_account_authority: sunrise_msol_account_authority.clone(),
            marinade_program: marinade_program.clone(),
        }
        .into(),
    );

    Ok(marinade_accounts)
}
