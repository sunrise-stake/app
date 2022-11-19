use crate::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use marinade_cpi::State as MarinadeState;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

// The price registered on the marinade state is divided by this number to get the actual price decimal
// TODO Document or find util from marinade for this
const MAGIC_NUMBER: Decimal = dec!(4294967296);

/// Given a sol amount (lamports), calculate the current equivalent msol amount
pub fn sol_to_msol(marinade_state: &MarinadeState, lamports: u64) -> Result<u64> {
    let price_dec_marinade = Decimal::from(marinade_state.msol_price);
    let price_dec = price_dec_marinade / MAGIC_NUMBER;
    let lamports_dec = Decimal::from(lamports);
    let msol_dec = lamports_dec / price_dec;
    msg!(
        "Sol {} MSol (dec) {} MSol (u64) {} price {}",
        lamports_dec,
        msol_dec,
        msol_dec.to_u64().unwrap(),
        price_dec
    );
    msol_dec
        .to_u64()
        .ok_or_else(|| error!(ErrorCode::MSolConversionOverflow))
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
    let gsol_supply_in_msol = sol_to_msol(marinade_state, gsol_supply)?;

    // The amount of msol in the shared account that is not matched by minted gsol
    let recoverable_msol = msol_balance - gsol_supply_in_msol;

    Ok(recoverable_msol)
}
