use crate::error::ErrorCode;
use crate::utils::seeds::GSOL_MINT_AUTHORITY;
use anchor_lang::prelude::borsh::BorshDeserialize;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};

/// The main state account for the Sunrise Stake program
///
/// IMPORTANT: This struct MUST remain named "State" and not be renamed.
/// The account discriminator is derived from the struct name, and renaming it would
/// change the discriminator from the current value, breaking compatibility with
/// all existing on-chain accounts. The discriminator is the first 8 bytes of
/// SHA256("account:State") and is checked by Anchor when deserializing accounts.
#[account]
pub struct State {
    pub marinade_state: Pubkey,

    pub update_authority: Pubkey,
    pub gsol_mint: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
    pub msol_authority_bump: u8,

    /// 0-100 - The proportion of the total staked SOL that should be in the
    /// liquidity pool.
    pub liq_pool_proportion: u8,
    /// 0-100 - If unstaking would result in the proportion of SOL in the
    /// liquidity pool dropping below this value, trigger an delayed unstake
    /// for the difference
    pub liq_pool_min_proportion: u8,

    pub blaze_state: Pubkey,
    pub marinade_minted_gsol: u64,
    pub blaze_minted_gsol: u64,
    pub bsol_authority_bump: u8,
}

impl State {
    pub const SPACE: usize = 32 + 32 + 32 + 32 + 1 + 1 + 1 + 1 + 32 + 8 + 8 + 1 + 8 /* DISCRIMINATOR */ ;

    pub fn set_values(&mut self, input: &StateInput, gsol_mint: &Pubkey) {
        self.marinade_state = input.marinade_state;
        self.blaze_state = input.blaze_state;
        self.update_authority = input.update_authority;
        self.gsol_mint_authority_bump = input.gsol_mint_authority_bump;
        self.msol_authority_bump = input.msol_authority_bump;
        self.bsol_authority_bump = input.bsol_authority_bump;
        self.treasury = input.treasury;
        self.gsol_mint = *gsol_mint;
        self.liq_pool_proportion = input.liq_pool_proportion;
        self.liq_pool_min_proportion = input.liq_pool_min_proportion;
        if let Some(val) = input.marinade_minted_gsol {
            self.marinade_minted_gsol = val;
        }
        if let Some(val) = input.blaze_minted_gsol {
            self.blaze_minted_gsol = val;
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct StateInput {
    pub marinade_state: Pubkey,
    pub blaze_state: Pubkey,
    pub update_authority: Pubkey,
    pub treasury: Pubkey,
    pub gsol_mint_authority_bump: u8,
    pub msol_authority_bump: u8,
    pub bsol_authority_bump: u8,
    pub liq_pool_proportion: u8,
    pub liq_pool_min_proportion: u8,
    pub marinade_minted_gsol: Option<u64>,
    pub blaze_minted_gsol: Option<u64>,
}

/// Maps a marinade ticket account to a GSOL token holder
#[account]
pub struct SunriseTicketAccount {
    pub state_address: Pubkey, // instance of sunrise state this ticket belongs to
    pub marinade_ticket_account: Pubkey,
    pub beneficiary: Pubkey,
}
impl SunriseTicketAccount {
    pub const SPACE: usize = 32 + 32 + 32 + 8 /* DISCRIMINATOR */ ;
}

#[account]
pub struct EpochReportAccount {
    pub state_address: Pubkey,
    pub epoch: u64,
    pub tickets: u64,
    pub total_ordered_lamports: u64,
    pub extractable_yield: u64,
    pub extracted_yield: u64,
    pub current_gsol_supply: u64,
    pub bump: u8,
}
impl EpochReportAccount {
    pub const SPACE: usize = 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 8 /* DISCRIMINATOR */ ;

    pub fn all_extractable_yield(&self) -> u64 {
        self.extractable_yield
            .checked_add(self.extracted_yield)
            .unwrap()
    }

    pub fn add_ticket(&mut self, ticket_amount_lamports: u64, clock: &Sysvar<Clock>) -> Result<()> {
        require_eq!(
            self.epoch,
            clock.epoch,
            ErrorCode::InvalidEpochReportAccount
        );
        self.tickets = self.tickets.checked_add(1).unwrap();
        self.total_ordered_lamports = self
            .total_ordered_lamports
            .checked_add(ticket_amount_lamports)
            .unwrap();
        Ok(())
    }

    pub fn add_extracted_yield(&mut self, extracted_yield: u64) {
        self.extracted_yield = self.extracted_yield.checked_add(extracted_yield).unwrap();
    }

    pub fn update_report(
        &mut self,
        current_gsol_supply: u64,
        extractable_yield: u64,
        add_extracted_yield: u64,
    ) {
        self.current_gsol_supply = current_gsol_supply;
        self.extractable_yield = extractable_yield;
        self.add_extracted_yield(add_extracted_yield);
    }
}

// If imported from the marinade crate, deserialisation does not work
// TODO fix
#[derive(Debug, BorshDeserialize)]
pub struct TicketAccountData {
    pub discriminator: u64,
    pub state_address: Pubkey, // instance of marinade state this ticket belongs to
    pub beneficiary: Pubkey,   // main account where to send SOL when claimed
    pub lamports_amount: u64,  // amount this ticked is worth
    pub created_epoch: u64, // epoch when this acc was created (epoch when delayed-unstake was requested)
}

#[derive(Accounts, Clone)]
pub struct CreateMetadata<'info> {
    #[account(
    has_one = marinade_state,
    has_one = update_authority,
    )]
    pub state: Box<Account<'info, State>>,

    /// CHECK: Validated in handler
    #[account()]
    pub marinade_state: UncheckedAccount<'info>,

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

    pub update_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,

    /// CHECK:
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    /// CHECK:
    pub token_metadata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(size: u64)]
pub struct ResizeState<'info> {
    #[account(
    mut,
    has_one = update_authority,
    realloc = size as usize,
    realloc::payer = payer,
    realloc::zero = false,
    )]
    pub state: Account<'info, State>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub update_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct LockAccount {
    pub state_address: Pubkey,
    pub owner: Pubkey,
    pub token_account: Pubkey,
    // unset until lock, then set to the epoch when the lock was set
    // on unlock, unset again
    pub start_epoch: Option<u64>,
    pub updated_to_epoch: Option<u64>,
    pub sunrise_yield_at_start: u64,
    pub yield_accrued_by_owner: u64,
    pub bump: u8,
}
impl LockAccount {
    pub const SPACE: usize = 32 + 32 + 32 + 9 + 9 + 8 + 8 + 1 + 8 /* DISCRIMINATOR */ ;

    pub fn calculate_and_add_yield_accrued(
        &mut self,
        epoch_report_account: &EpochReportAccount,
        locked_gsol_token_account: &Account<'_, TokenAccount>,
    ) -> Result<u64> {
        require_keys_eq!(
            self.state_address,
            epoch_report_account.state_address,
            ErrorCode::InvalidEpochReportAccount
        );

        require_keys_eq!(
            self.token_account,
            locked_gsol_token_account.key(),
            ErrorCode::LockAccountIncorrectOwner
        );

        let new_accrued_yield = epoch_report_account.all_extractable_yield();
        let yield_accrued = new_accrued_yield
            .checked_sub(self.sunrise_yield_at_start)
            .unwrap();

        let yield_accrued_with_unstake_fee = (yield_accrued as f64) * 0.997; // estimated 0.3% unstake fee

        msg!("total yield at start of lock period: {}\ntotal yield at end of lock period: {}\nyield_accrued: {}",
            self.sunrise_yield_at_start,
            epoch_report_account.all_extractable_yield(),
            yield_accrued_with_unstake_fee
        );

        let owner_locked_gsol_share = (locked_gsol_token_account.amount as f64)
            / epoch_report_account.current_gsol_supply as f64;

        msg!("owner_locked_gsol_share: {}", owner_locked_gsol_share);

        let yield_accrued = (yield_accrued_with_unstake_fee * owner_locked_gsol_share) as u64;

        self.yield_accrued_by_owner = self
            .yield_accrued_by_owner
            .checked_add(yield_accrued)
            .unwrap();

        msg!("yield_accrued_by_owner: {}", self.yield_accrued_by_owner);

        // Update the sunrise yield at start - this name is a little confusing,
        // but essentially each time the lock account is updated, we interpret this as a new
        // lock period starting, and we set the sunrise yield at start to the current yield
        self.sunrise_yield_at_start = new_accrued_yield;

        // we are updated to this epoch
        self.updated_to_epoch = Some(epoch_report_account.epoch);

        Ok(yield_accrued)
    }
}
