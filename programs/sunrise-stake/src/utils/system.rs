use crate::marinade::program::MarinadeFinance;
use crate::utils::seeds::ORDER_UNSTAKE_TICKET_ACCOUNT;
use crate::{State, TriggerPoolRebalance};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction;

pub const MARINADE_TICKET_ACCOUNT_SPACE: u64 = 32 + 32 + 8 + 8 + 8;

pub struct CreateAccountProperties<'info> {
    state: Box<Account<'info, State>>,
    payer: Signer<'info>,
    /// CHECK: PDA checked by anchor in the instruction
    new_account: AccountInfo<'info>,
    system_program: Program<'info, System>,
    marinade_program: Program<'info, MarinadeFinance>,
    rent: Sysvar<'info, Rent>,
    clock: Sysvar<'info, Clock>,
}
impl<'a> From<TriggerPoolRebalance<'a>> for CreateAccountProperties<'a> {
    fn from(trigger_pool_rebalance: TriggerPoolRebalance<'a>) -> Self {
        Self {
            state: trigger_pool_rebalance.state,
            // TODO factor in rent cost in amount to be withdrawn
            payer: trigger_pool_rebalance.payer,
            new_account: trigger_pool_rebalance
                .order_unstake_ticket_account
                .to_account_info(),
            system_program: trigger_pool_rebalance.system_program,
            marinade_program: trigger_pool_rebalance.marinade_program,
            rent: trigger_pool_rebalance.rent,
            clock: trigger_pool_rebalance.clock,
        }
    }
}
impl<'a> From<&TriggerPoolRebalance<'a>> for CreateAccountProperties<'a> {
    fn from(trigger_pool_rebalance: &TriggerPoolRebalance<'a>) -> Self {
        trigger_pool_rebalance.to_owned().into()
    }
}

// Create an order unstake ticket account.
// This is the equivalent to adding "init" to the anchor account macro. But we do this in code instead
// to avoid creating one if we don't need it.
pub fn create_order_unstake_ticket_account(
    properties: &CreateAccountProperties,
    order_unstake_ticket_account_bump: u8,
    order_unstake_ticket_account_index: u64,
) -> Result<()> {
    let new_ticket_lamports = properties
        .rent
        .minimum_balance(MARINADE_TICKET_ACCOUNT_SPACE as usize);

    let state = properties.state.key();
    let epoch = properties.clock.epoch.to_be_bytes();
    let index = order_unstake_ticket_account_index.to_be_bytes();
    let bump = &[order_unstake_ticket_account_bump][..];
    let seeds = &[
        state.as_ref(),
        ORDER_UNSTAKE_TICKET_ACCOUNT,
        epoch.as_ref(),
        index.as_ref(),
        bump,
    ][..];

    // Using invoke_signed directly instead of using CpiContext because we want to use invoke_signed,
    // but not use create_account_with_seed, which is difficult to use.
    invoke_signed(
        &system_instruction::create_account(
            &properties.payer.key(),
            &properties.new_account.key(),
            new_ticket_lamports,
            MARINADE_TICKET_ACCOUNT_SPACE,
            properties.marinade_program.key,
        ),
        &[
            properties.payer.to_account_info(),
            properties.new_account.to_account_info(),
            properties.system_program.to_account_info(),
        ],
        &[seeds],
    )?;

    Ok(())
}
