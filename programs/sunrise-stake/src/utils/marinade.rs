use crate::instructions::{InitEpochReport, RecoverTickets};
use crate::{
    utils::{calc::proportional, seeds::MSOL_ACCOUNT, spl},
    ClaimUnstakeTicket, Deposit, DepositStakeAccount, EpochReportAccount, ExtractToTreasury,
    LiquidUnstake, OrderUnstake, State, TriggerPoolRebalance,
};
use anchor_lang::{
    context::CpiContext,
    prelude::*,
    solana_program::{borsh::try_from_slice_unchecked, stake::state::StakeState},
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use marinade_cpi::{
    cpi::{
        accounts::{
            AddLiquidity as MarinadeAddLiquidity, Claim as MarinadeClaim,
            Deposit as MarinadeDeposit, DepositStakeAccount as MarinadeDepositStakeAccount,
            LiquidUnstake as MarinadeLiquidUnstake, OrderUnstake as MarinadeOrderUnstake,
            RemoveLiquidity as MarinadeRemoveLiquidity,
        },
        add_liquidity as marinade_add_liquidity, claim as marinade_claim,
        deposit as marinade_deposit, deposit_stake_account as marinade_deposit_stake_account,
        liquid_unstake as marinade_liquid_unstake, order_unstake as marinade_order_unstake,
        remove_liquidity as marinade_remove_liquidity,
    },
    program::MarinadeFinance,
    State as MarinadeState,
};

pub struct GenericUnstakeProperties<'info> {
    state: Box<Account<'info, State>>,
    marinade_state: Box<Account<'info, MarinadeState>>,
    msol_mint: Box<Account<'info, Mint>>,
    /// CHECK: Checked in marinade program
    liq_pool_sol_leg_pda: UncheckedAccount<'info>,
    liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,
    /// CHECK: Checked in marinade program
    treasury_msol_account: Box<Account<'info, TokenAccount>>,
    get_msol_from: Box<Account<'info, TokenAccount>>,
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
impl<'a> From<ExtractToTreasury<'a>> for GenericUnstakeProperties<'a> {
    fn from(properties: ExtractToTreasury<'a>) -> Self {
        Self {
            state: properties.state,
            marinade_state: properties.marinade_state,
            msol_mint: properties.msol_mint,
            liq_pool_sol_leg_pda: properties.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: properties.liq_pool_msol_leg,
            treasury_msol_account: properties.treasury_msol_account,
            get_msol_from: properties.get_msol_from,
            get_msol_from_authority: properties.get_msol_from_authority,
            recipient: properties.treasury.to_account_info(),
            system_program: properties.system_program,
            token_program: properties.token_program,
            marinade_program: properties.marinade_program,
        }
    }
}
impl<'a> From<&ExtractToTreasury<'a>> for GenericUnstakeProperties<'a> {
    fn from(properties: &ExtractToTreasury<'a>) -> Self {
        properties.to_owned().into()
    }
}

pub struct OrderUnstakeProperties<'info> {
    state: Box<Account<'info, State>>,
    marinade_state: Box<Account<'info, MarinadeState>>,
    msol_mint: Account<'info, Mint>,
    burn_msol_from: Account<'info, TokenAccount>,
    burn_msol_authority: SystemAccount<'info>,
    /// CHECK: Checked in the marinade program
    new_ticket_account: AccountInfo<'info>,
    token_program: Program<'info, Token>,
    marinade_program: Program<'info, MarinadeFinance>,
    rent: Sysvar<'info, Rent>,
    clock: Sysvar<'info, Clock>,
}
impl<'a> From<OrderUnstake<'a>> for OrderUnstakeProperties<'a> {
    fn from(unstake: OrderUnstake<'a>) -> Self {
        Self {
            state: unstake.state,
            marinade_state: unstake.marinade_state,
            msol_mint: unstake.msol_mint,
            burn_msol_from: unstake.get_msol_from,
            burn_msol_authority: unstake.get_msol_from_authority,
            new_ticket_account: unstake.new_ticket_account.to_account_info(),
            token_program: unstake.token_program,
            marinade_program: unstake.marinade_program,
            rent: unstake.rent,
            clock: unstake.clock,
        }
    }
}
impl<'a> From<&OrderUnstake<'a>> for OrderUnstakeProperties<'a> {
    fn from(unstake: &OrderUnstake<'a>) -> Self {
        unstake.to_owned().into()
    }
}
impl<'a> From<TriggerPoolRebalance<'a>> for OrderUnstakeProperties<'a> {
    fn from(trigger_pool_rebalance: TriggerPoolRebalance<'a>) -> Self {
        Self {
            state: trigger_pool_rebalance.state,
            marinade_state: trigger_pool_rebalance.marinade_state,
            msol_mint: *trigger_pool_rebalance.msol_mint,
            burn_msol_from: *trigger_pool_rebalance.get_msol_from,
            burn_msol_authority: trigger_pool_rebalance.get_msol_from_authority,
            new_ticket_account: trigger_pool_rebalance
                .order_unstake_ticket_account
                .to_account_info(),
            token_program: trigger_pool_rebalance.token_program,
            marinade_program: trigger_pool_rebalance.marinade_program,
            rent: trigger_pool_rebalance.rent,
            clock: trigger_pool_rebalance.clock,
        }
    }
}
impl<'a> From<&TriggerPoolRebalance<'a>> for OrderUnstakeProperties<'a> {
    fn from(unstake: &TriggerPoolRebalance<'a>) -> Self {
        unstake.to_owned().into()
    }
}

pub struct ClaimUnstakeTicketProperties<'info> {
    pub marinade_state: Box<Account<'info, MarinadeState>>,
    /// CHECK: Checked in the marinade program
    pub reserve_pda: AccountInfo<'info>,
    /// CHECK: Checked in the marinade program
    pub ticket_account: AccountInfo<'info>,
    /// CHECK: Checked in the marinade program
    pub transfer_sol_to: AccountInfo<'info>,
    pub marinade_program: Program<'info, MarinadeFinance>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}
impl<'a> From<ClaimUnstakeTicket<'a>> for ClaimUnstakeTicketProperties<'a> {
    fn from(claim: ClaimUnstakeTicket<'a>) -> Self {
        Self {
            marinade_state: claim.marinade_state,
            reserve_pda: claim.reserve_pda.to_account_info(),
            ticket_account: claim.marinade_ticket_account.to_account_info(),
            transfer_sol_to: claim.msol_authority.to_account_info(),
            marinade_program: claim.marinade_program,
            clock: claim.clock,
            system_program: claim.system_program,
        }
    }
}
impl<'a> From<&ClaimUnstakeTicket<'a>> for ClaimUnstakeTicketProperties<'a> {
    fn from(claim: &ClaimUnstakeTicket<'a>) -> Self {
        claim.to_owned().into()
    }
}
impl<'a> From<RecoverTickets<'a>> for ClaimUnstakeTicketProperties<'a> {
    fn from(recover_tickets: RecoverTickets<'a>) -> Self {
        Self {
            marinade_state: recover_tickets.marinade_state,
            reserve_pda: recover_tickets.reserve_pda.to_account_info(),
            transfer_sol_to: recover_tickets.get_msol_from_authority.to_account_info(),
            // Temporary and will be overwritten
            // TODO clean up
            ticket_account: recover_tickets.marinade_program.to_account_info(),
            marinade_program: recover_tickets.marinade_program,
            clock: recover_tickets.clock,
            system_program: recover_tickets.system_program,
        }
    }
}
impl<'a> From<&RecoverTickets<'a>> for ClaimUnstakeTicketProperties<'a> {
    fn from(recover_tickets: &RecoverTickets<'a>) -> Self {
        recover_tickets.to_owned().into()
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

pub fn deposit_stake_account(accounts: &DepositStakeAccount, validator_index: u32) -> Result<()> {
    let cpi_program = accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeDepositStakeAccount {
        state: accounts.marinade_state.to_account_info(),
        validator_list: accounts.validator_list.to_account_info(),
        stake_list: accounts.stake_list.to_account_info(),
        stake_account: accounts.stake_account.to_account_info(),
        stake_authority: accounts.stake_authority.to_account_info(),
        duplication_flag: accounts.duplication_flag.to_account_info(),
        rent_payer: accounts.stake_authority.to_account_info(),
        msol_mint: accounts.msol_mint.to_account_info(),
        mint_to: accounts.mint_msol_to.to_account_info(),
        msol_mint_authority: accounts.msol_mint_authority.to_account_info(),
        clock: accounts.clock.to_account_info(),
        rent: accounts.rent.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        token_program: accounts.token_program.to_account_info(),
        stake_program: accounts.stake_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    marinade_deposit_stake_account(cpi_ctx, validator_index)
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
    marinade_liquid_unstake(cpi_ctx.with_signer(&[seeds]), msol_lamports)
}

pub fn order_unstake(accounts: &OrderUnstakeProperties, msol_lamports: u64) -> Result<()> {
    let cpi_program = accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeOrderUnstake {
        state: accounts.marinade_state.to_account_info(),
        msol_mint: accounts.msol_mint.to_account_info(),
        burn_msol_from: accounts.burn_msol_from.to_account_info(),
        burn_msol_authority: accounts.burn_msol_authority.to_account_info(),
        new_ticket_account: accounts.new_ticket_account.to_account_info(),
        token_program: accounts.token_program.to_account_info(),
        rent: accounts.rent.to_account_info(),
        clock: accounts.clock.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    msg!("OrderUnstake CPI");
    let bump = &[accounts.state.msol_authority_bump][..];
    let state_address = accounts.state.key();
    let seeds = &[state_address.as_ref(), MSOL_ACCOUNT, bump][..];
    marinade_order_unstake(cpi_ctx.with_signer(&[seeds]), msol_lamports)
}

pub fn claim_unstake_ticket(accounts: &ClaimUnstakeTicketProperties) -> Result<()> {
    let cpi_program = accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeClaim {
        state: accounts.marinade_state.to_account_info(),
        reserve_pda: accounts.reserve_pda.to_account_info(),
        ticket_account: accounts.ticket_account.to_account_info(),
        transfer_sol_to: accounts.transfer_sol_to.to_account_info(),
        clock: accounts.clock.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    msg!("Claim CPI");
    marinade_claim(cpi_ctx)
}

pub struct AddLiquidityProperties<'info> {
    state: Box<Account<'info, State>>,
    marinade_state: Box<Account<'info, MarinadeState>>,
    liq_pool_mint: Box<Account<'info, Mint>>,
    /// CHECK: Checked in marinade program
    liq_pool_mint_authority: UncheckedAccount<'info>,
    /// CHECK: Checked in marinade program
    liq_pool_sol_leg_pda: UncheckedAccount<'info>,
    liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,
    /// CHECK: Checked in marinade program
    transfer_from: AccountInfo<'info>,
    mint_liq_pool_to: Box<Account<'info, TokenAccount>>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    marinade_program: Program<'info, MarinadeFinance>,
}
impl<'a> From<Deposit<'a>> for AddLiquidityProperties<'a> {
    fn from(deposit: Deposit<'a>) -> Self {
        Self {
            state: deposit.state,
            marinade_state: deposit.marinade_state,
            liq_pool_mint: deposit.liq_pool_mint,
            liq_pool_mint_authority: deposit.liq_pool_mint_authority,
            liq_pool_sol_leg_pda: deposit.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: deposit.liq_pool_msol_leg,
            transfer_from: deposit.transfer_from.to_account_info(),
            mint_liq_pool_to: deposit.mint_liq_pool_to,
            system_program: deposit.system_program,
            token_program: deposit.token_program,
            marinade_program: deposit.marinade_program,
        }
    }
}
impl<'a> From<&Deposit<'a>> for AddLiquidityProperties<'a> {
    fn from(deposit: &Deposit<'a>) -> Self {
        deposit.to_owned().into()
    }
}
impl<'a> From<RecoverTickets<'a>> for AddLiquidityProperties<'a> {
    fn from(recover_tickets: RecoverTickets<'a>) -> Self {
        Self {
            state: recover_tickets.state,
            marinade_state: recover_tickets.marinade_state,
            liq_pool_mint: recover_tickets.liq_pool_mint,
            liq_pool_mint_authority: recover_tickets.liq_pool_mint_authority,
            liq_pool_sol_leg_pda: recover_tickets.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: recover_tickets.liq_pool_msol_leg,
            transfer_from: recover_tickets.get_msol_from_authority.to_account_info(),
            mint_liq_pool_to: recover_tickets.liq_pool_token_account,
            system_program: recover_tickets.system_program,
            token_program: recover_tickets.token_program,
            marinade_program: recover_tickets.marinade_program,
        }
    }
}
impl<'a> From<&RecoverTickets<'a>> for AddLiquidityProperties<'a> {
    fn from(recover_tickets: &RecoverTickets<'a>) -> Self {
        recover_tickets.to_owned().into()
    }
}

fn create_add_liquidity_ctx<'a, 'b, 'c, 'info>(
    accounts: &'a AddLiquidityProperties<'info>,
) -> CpiContext<'a, 'b, 'c, 'info, MarinadeAddLiquidity<'info>> {
    let cpi_program = accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeAddLiquidity {
        state: accounts.marinade_state.to_account_info(),
        lp_mint: accounts.liq_pool_mint.to_account_info(),
        liq_pool_sol_leg_pda: accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: accounts.liq_pool_msol_leg.to_account_info(),
        transfer_from: accounts.transfer_from.to_account_info(),
        mint_to: accounts.mint_liq_pool_to.to_account_info(),
        lp_mint_authority: accounts.liq_pool_mint_authority.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        token_program: accounts.token_program.to_account_info(),
    };
    CpiContext::new(cpi_program, cpi_accounts)
}

pub fn add_liquidity(accounts: &AddLiquidityProperties, lamports: u64) -> Result<()> {
    let cpi_ctx = create_add_liquidity_ctx(accounts);
    marinade_add_liquidity(cpi_ctx, lamports)
}

pub fn add_liquidity_from_pda(accounts: &AddLiquidityProperties, lamports: u64) -> Result<()> {
    let cpi_ctx = create_add_liquidity_ctx(accounts);
    let bump = &[accounts.state.msol_authority_bump][..];
    let state_address = accounts.state.key();
    let seeds = &[state_address.as_ref(), MSOL_ACCOUNT, bump][..];
    marinade_add_liquidity(cpi_ctx.with_signer(&[seeds]), lamports)
}

pub fn remove_liquidity(accounts: &LiquidUnstake, liq_pool_tokens: u64) -> Result<()> {
    let cpi_program = accounts.marinade_program.to_account_info();
    let cpi_accounts = MarinadeRemoveLiquidity {
        state: accounts.marinade_state.to_account_info(),
        lp_mint: accounts.liq_pool_mint.to_account_info(),
        burn_from: accounts.get_liq_pool_token_from.to_account_info(),
        // We use the same authority PDA for the liquidity pool token and msol token account
        burn_from_authority: accounts.get_msol_from_authority.to_account_info(),
        transfer_sol_to: accounts.gsol_token_account_authority.to_account_info(),
        // The msol goes into the msol PDA pot owned by sunrise
        transfer_msol_to: accounts.get_msol_from.to_account_info(),
        liq_pool_sol_leg_pda: accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: accounts.liq_pool_msol_leg.to_account_info(),
        liq_pool_msol_leg_authority: accounts.liq_pool_msol_leg_authority.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        token_program: accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    let bump = &[accounts.state.msol_authority_bump][..];
    let state_address = accounts.state.key();
    let seeds = &[state_address.as_ref(), MSOL_ACCOUNT, bump][..];
    marinade_remove_liquidity(cpi_ctx.with_signer(&[seeds]), liq_pool_tokens)
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
    msg!("calc_msol_from_lamports");
    msg!("stake_lamports: {}", stake_lamports);
    msg!("marinade_state.msol_supply: {}", marinade_state.msol_supply);
    msg!(
        "total_virtual_staked_lamports: {}",
        total_virtual_staked_lamports(marinade_state)
    );
    proportional(
        stake_lamports,
        marinade_state.msol_supply,
        total_virtual_staked_lamports(marinade_state),
    )
}

pub fn calc_lamports_from_msol_amount(
    marinade_state: &MarinadeState,
    msol_amount: u64,
) -> Result<u64> {
    proportional(
        msol_amount,
        total_virtual_staked_lamports(marinade_state),
        marinade_state.msol_supply,
    )
}

pub struct CalculateExtractableYieldProperties<'info> {
    marinade_state: Box<Account<'info, MarinadeState>>,
    blaze_state: UncheckedAccount<'info>,
    gsol_mint: Box<Account<'info, Mint>>,
    liq_pool_mint: Box<Account<'info, Mint>>,
    liq_pool_sol_leg_pda: UncheckedAccount<'info>,
    liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,
    liq_pool_token_account: Box<Account<'info, TokenAccount>>,
    get_msol_from: Box<Account<'info, TokenAccount>>,
    get_bsol_from: Box<Account<'info, TokenAccount>>,
}
impl<'a> From<ExtractToTreasury<'a>> for CalculateExtractableYieldProperties<'a> {
    fn from(extract_to_treasury: ExtractToTreasury<'a>) -> Self {
        Self {
            marinade_state: extract_to_treasury.marinade_state,
            blaze_state: extract_to_treasury.blaze_state,
            gsol_mint: extract_to_treasury.gsol_mint,
            liq_pool_mint: extract_to_treasury.liq_pool_mint,
            liq_pool_sol_leg_pda: extract_to_treasury.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: extract_to_treasury.liq_pool_msol_leg,
            liq_pool_token_account: extract_to_treasury.liq_pool_token_account,
            get_msol_from: extract_to_treasury.get_msol_from,
            get_bsol_from: extract_to_treasury.get_bsol_from,
        }
    }
}
impl<'a> From<&ExtractToTreasury<'a>> for CalculateExtractableYieldProperties<'a> {
    fn from(extract_to_treasury: &ExtractToTreasury<'a>) -> Self {
        extract_to_treasury.to_owned().into()
    }
}
impl<'a> From<InitEpochReport<'a>> for CalculateExtractableYieldProperties<'a> {
    fn from(init_epoch_pool_report: InitEpochReport<'a>) -> Self {
        Self {
            marinade_state: init_epoch_pool_report.marinade_state,
            blaze_state: init_epoch_pool_report.blaze_state,
            gsol_mint: init_epoch_pool_report.gsol_mint,
            liq_pool_mint: init_epoch_pool_report.liq_pool_mint,
            liq_pool_sol_leg_pda: init_epoch_pool_report.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: init_epoch_pool_report.liq_pool_msol_leg,
            liq_pool_token_account: init_epoch_pool_report.liq_pool_token_account,
            get_msol_from: init_epoch_pool_report.get_msol_from,
            get_bsol_from: init_epoch_pool_report.get_bsol_from,
        }
    }
}
impl<'a> From<&InitEpochReport<'a>> for CalculateExtractableYieldProperties<'a> {
    fn from(extract_to_treasury: &InitEpochReport<'a>) -> Self {
        extract_to_treasury.to_owned().into()
    }
}
impl<'a> From<RecoverTickets<'a>> for CalculateExtractableYieldProperties<'a> {
    fn from(recover_tickets: RecoverTickets<'a>) -> Self {
        Self {
            marinade_state: recover_tickets.marinade_state,
            blaze_state: recover_tickets.blaze_state,
            gsol_mint: recover_tickets.gsol_mint,
            liq_pool_mint: recover_tickets.liq_pool_mint,
            liq_pool_sol_leg_pda: recover_tickets.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: recover_tickets.liq_pool_msol_leg,
            liq_pool_token_account: recover_tickets.liq_pool_token_account,
            get_msol_from: recover_tickets.get_msol_from,
            get_bsol_from: recover_tickets.get_bsol_from,
        }
    }
}
impl<'a> From<&RecoverTickets<'a>> for CalculateExtractableYieldProperties<'a> {
    fn from(recover_tickets: &RecoverTickets<'a>) -> Self {
        recover_tickets.to_owned().into()
    }
}
/// Calculate the current recoverable yield (in msol) from marinade.
/// Recoverable yield is defined as the sol value of the msol + lp tokens
/// that are not matched by gsol
pub fn calculate_extractable_yield(accounts: &CalculateExtractableYieldProperties) -> Result<u64> {
    let blaze_stake_pool = spl::deserialize_spl_stake_pool(&accounts.blaze_state)?;

    let liquidity_pool_balance = current_liq_pool_balance(
        &accounts.marinade_state,
        &accounts.liq_pool_mint,
        &accounts.liq_pool_token_account,
        &accounts.liq_pool_sol_leg_pda,
        &accounts.liq_pool_msol_leg,
    )?;
    // Calculate the sol value of all msol + lp tokens held by this sunrise instance
    let lp_value = liquidity_pool_balance.sol_value(&accounts.marinade_state);
    let msol_value =
        calc_lamports_from_msol_amount(&accounts.marinade_state, accounts.get_msol_from.amount)?;
    let bsol_value =
        spl::calc_lamports_from_bsol_amount(&blaze_stake_pool, accounts.get_bsol_from.amount)?;
    let total_staked_value = lp_value
        .checked_add(msol_value)
        .unwrap()
        .checked_add(bsol_value)
        .expect("total_staked_value");

    let gsol_supply = accounts.gsol_mint.supply;
    let total_extractable_yield = total_staked_value.saturating_sub(gsol_supply);

    // TODO Remove when no longer debugging
    msg!("lp_value: {}", lp_value);
    msg!("msol_value: {}", msol_value);
    msg!("bsol_value: {}", bsol_value);
    msg!("total_staked_value: {}", total_staked_value);
    msg!("gsol_supply: {}", gsol_supply);
    msg!("total_extractable_yield: {}", total_extractable_yield);

    Ok(total_extractable_yield)
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct LiquidityPoolBalance {
    pub lamports: u64,
    pub msol: u64,
    pub liq_pool_token: u64,
}
impl LiquidityPoolBalance {
    fn new(sol_leg: u64, msol_leg: u64, total_liq_pool_tokens: u64) -> Self {
        LiquidityPoolBalance {
            lamports: sol_leg,
            msol: msol_leg,
            liq_pool_token: total_liq_pool_tokens,
        }
    }

    fn value_of(&self, liq_pool_token: u64) -> Result<Self> {
        let lamports = proportional(self.lamports, liq_pool_token, self.liq_pool_token)?;
        let msol = proportional(self.msol, liq_pool_token, self.liq_pool_token)?;
        Ok(LiquidityPoolBalance {
            lamports,
            msol,
            liq_pool_token,
        })
    }

    // The value of both legs of the liquidity pool balance in SOL
    fn sol_value(&self, marinade_state: &MarinadeState) -> u64 {
        let lamports = self.lamports;
        let msol = calc_lamports_from_msol_amount(marinade_state, self.msol).unwrap();
        lamports.checked_add(msol).expect("sol_value")
    }

    // if this balance in lamports is smaller than other_lamports, return this,
    // otherwise return a liquidity pool balance with lamports = other_lamports
    // and liq_pool_token = the amount of liq_pool_token that would be needed to withdraw
    // other_lamports from the liquidity pool
    fn min_lamports(&self, other_lamports: u64) -> Result<Self> {
        if self.lamports < other_lamports {
            return Ok(*self);
        }
        let other_liq_pool_token =
            proportional(self.liq_pool_token, other_lamports, self.lamports)?;
        let other_msol = proportional(self.msol, other_lamports, self.lamports)?;
        Ok(Self {
            lamports: other_lamports,
            msol: other_msol,
            liq_pool_token: other_liq_pool_token,
        })
    }

    // returns a new balance that is the result of subtracting other_lamports from this balance
    fn checked_sub_lamports(&self, other_lamports: u64) -> Result<Self> {
        let new_lamports = self
            .lamports
            .checked_sub(other_lamports)
            .expect("checked_sub_lamports");
        let new_liq_pool_token = proportional(self.liq_pool_token, new_lamports, self.lamports)?;

        let new_msol = proportional(self.msol, new_lamports, self.lamports)?;
        Ok(Self {
            lamports: new_lamports,
            msol: new_msol,
            liq_pool_token: new_liq_pool_token,
        })
    }
}

// Prevent the compiler from enlarging the stack and potentially triggering an Access violation
#[inline(never)]
pub fn current_liq_pool_balance<'a>(
    marinade_state: &MarinadeState,
    liq_pool_mint: &Account<'a, Mint>,
    liq_pool_token_account: &Account<'a, TokenAccount>,
    liq_pool_sol_leg_pda: &AccountInfo,
    liq_pool_msol_leg: &Account<'a, TokenAccount>,
) -> Result<LiquidityPoolBalance> {
    //compute current liq-pool total value
    let total_balance = total_liq_pool(
        marinade_state,
        liq_pool_mint,
        liq_pool_sol_leg_pda,
        liq_pool_msol_leg,
    );

    // The SOL amount held by sunrise in the liquidity pool is the total value of the pool in SOL
    // multiplied by the proportion of the pool owned by this SunshineStake instance
    let sunrise_liq_pool_balance = total_balance.value_of(liq_pool_token_account.amount)?;

    msg!("Total LP: {:?}", total_balance);
    msg!("Sunrise LP: {:?}", sunrise_liq_pool_balance);
    msg!(
        "Total LP value: {:?}",
        total_balance.sol_value(marinade_state)
    );
    msg!(
        "Sunrise LP value: {:?}",
        sunrise_liq_pool_balance.sol_value(marinade_state)
    );

    Ok(sunrise_liq_pool_balance)
}

fn total_liq_pool(
    marinade_state: &MarinadeState,
    liq_pool_mint: &Account<Mint>,
    liq_pool_sol_leg_pda: &AccountInfo,
    liq_pool_msol_leg: &Account<TokenAccount>,
) -> LiquidityPoolBalance {
    let sol_leg_lamports = liq_pool_sol_leg_pda
        .lamports()
        .checked_sub(marinade_state.rent_exempt_for_token_acc)
        .expect("sol_leg_lamports");

    LiquidityPoolBalance::new(
        sol_leg_lamports,
        liq_pool_msol_leg.amount,
        liq_pool_mint.supply,
    )
}

/// The preferred liquidity pool balance is a proportion of the total issued gsol
/// (after accounting for the deposit)
pub fn preferred_liq_pool_balance(
    state: &State,
    gsol_mint: &Account<'_, Mint>,
    lamports_being_staked: u64,
) -> Result<u64> {
    let gsol_supply_after_deposit = gsol_mint
        .supply
        .checked_add(lamports_being_staked)
        .expect("gsol_supply_after_deposit");
    proportional(
        gsol_supply_after_deposit,        // total
        state.liq_pool_proportion as u64, // preferred
        100,
    )
}

// the minimum allowable balance of SOL staked in liquidity pool, after an unstake
// is:
//      the total gsol supply (after removing the stake that is being removed)
//      * the minimum liquidity pool proportion
pub fn preferred_liq_pool_min_balance(
    state: &State,
    gsol_mint: &Account<'_, Mint>,
    lamports_being_unstaked: u64,
) -> Result<u64> {
    let gsol_supply_after_unstake = gsol_mint
        .supply
        .checked_sub(lamports_being_unstaked)
        .expect("gsol_supply_after_unstake");
    proportional(
        gsol_supply_after_unstake,            // total
        state.liq_pool_min_proportion as u64, // preferred
        100,
    )
}

pub fn amount_to_be_deposited_in_liq_pool(accounts: &Deposit, lamports: u64) -> Result<u64> {
    let liq_pool_balance = current_liq_pool_balance(
        &accounts.marinade_state,
        &accounts.liq_pool_mint,
        &accounts.mint_liq_pool_to,
        &accounts.liq_pool_sol_leg_pda,
        &accounts.liq_pool_msol_leg,
    )?;
    let preferred_balance =
        preferred_liq_pool_balance(&accounts.state, &accounts.gsol_mint, lamports)?;

    // if the preferred balance is less than the actual current balance, then we don't need to deposit
    // any more. Return 0.
    // This can happen if the value of the liquidity pool rises, via yield accrued through fees.
    let liq_pool_value = liq_pool_balance.sol_value(&accounts.marinade_state);
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

pub struct LiquidUnstakeAmounts {
    pub amount_to_withdraw_from_liq_pool: LiquidityPoolBalance,
    pub amount_to_liquid_unstake: u64,
    pub amount_to_order_delayed_unstake: u64,
}
pub struct PoolBalanceProperties<'info> {
    state: Box<Account<'info, State>>,
    marinade_state: Box<Account<'info, MarinadeState>>,
    gsol_mint: Box<Account<'info, Mint>>,
    liq_pool_mint: Box<Account<'info, Mint>>,
    /// CHECK: Checked in marinade program
    liq_pool_sol_leg_pda: UncheckedAccount<'info>,
    liq_pool_msol_leg: Box<Account<'info, TokenAccount>>,
    liq_pool_token_account: Box<Account<'info, TokenAccount>>,
    epoch_report_account: Option<Account<'info, EpochReportAccount>>,
}
impl<'a> From<LiquidUnstake<'a>> for PoolBalanceProperties<'a> {
    fn from(unstake: LiquidUnstake<'a>) -> Self {
        Self {
            state: unstake.state,
            marinade_state: unstake.marinade_state,
            gsol_mint: unstake.gsol_mint,
            liq_pool_mint: unstake.liq_pool_mint,
            liq_pool_sol_leg_pda: unstake.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: unstake.liq_pool_msol_leg,
            liq_pool_token_account: unstake.get_liq_pool_token_from,
            epoch_report_account: None,
        }
    }
}
impl<'a> From<&LiquidUnstake<'a>> for PoolBalanceProperties<'a> {
    fn from(unstake: &LiquidUnstake<'a>) -> Self {
        unstake.to_owned().into()
    }
}
impl<'a> From<TriggerPoolRebalance<'a>> for PoolBalanceProperties<'a> {
    fn from(trigger_pool_rebalance: TriggerPoolRebalance<'a>) -> Self {
        Self {
            state: trigger_pool_rebalance.state,
            marinade_state: trigger_pool_rebalance.marinade_state,
            gsol_mint: trigger_pool_rebalance.gsol_mint,
            liq_pool_mint: trigger_pool_rebalance.liq_pool_mint,
            liq_pool_sol_leg_pda: trigger_pool_rebalance.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: trigger_pool_rebalance.liq_pool_msol_leg,
            liq_pool_token_account: trigger_pool_rebalance.liq_pool_token_account,
            epoch_report_account: Some(*trigger_pool_rebalance.epoch_report_account),
        }
    }
}
impl<'a> From<&TriggerPoolRebalance<'a>> for PoolBalanceProperties<'a> {
    fn from(trigger_pool_rebalance: &TriggerPoolRebalance<'a>) -> Self {
        trigger_pool_rebalance.to_owned().into()
    }
}
impl<'a> From<ExtractToTreasury<'a>> for PoolBalanceProperties<'a> {
    fn from(properties: ExtractToTreasury<'a>) -> Self {
        Self {
            state: properties.state,
            marinade_state: properties.marinade_state,
            gsol_mint: properties.gsol_mint,
            liq_pool_mint: properties.liq_pool_mint,
            liq_pool_sol_leg_pda: properties.liq_pool_sol_leg_pda,
            liq_pool_msol_leg: properties.liq_pool_msol_leg,
            liq_pool_token_account: properties.liq_pool_token_account,
            // "in-flight" SOL being rebalanced are not counted as part of the sunrise stake instance's valuation.
            epoch_report_account: None,
        }
    }
}
impl<'a> From<&ExtractToTreasury<'a>> for PoolBalanceProperties<'a> {
    fn from(properties: &ExtractToTreasury<'a>) -> Self {
        properties.to_owned().into()
    }
}
// Prevent the compiler from enlarging the stack and potentially triggering an Access violation
#[inline(never)]
pub fn calculate_pool_balance_amounts(
    accounts: &PoolBalanceProperties,
    requested_withdrawal_lamports: u64,
) -> Result<Box<LiquidUnstakeAmounts>> {
    // The current balance of the liquidity pool
    let liq_pool_balance = current_liq_pool_balance(
        &accounts.marinade_state,
        &accounts.liq_pool_mint,
        &accounts.liq_pool_token_account,
        &accounts.liq_pool_sol_leg_pda,
        &accounts.liq_pool_msol_leg,
    )?;

    // The allowable minimum balance of the liquidity pool, after the gsol being unstaked is burned
    let preferred_min_liq_pool_after_unstake = preferred_liq_pool_min_balance(
        &accounts.state,
        &accounts.gsol_mint,
        requested_withdrawal_lamports,
    )?;

    // TODO need to convert all values here to SOL from LP token balances

    // The amount the user is allowed to withdraw from the liquidity pool. This is the entire current liquidity pool
    let amount_to_withdraw_from_liq_pool =
        liq_pool_balance.min_lamports(requested_withdrawal_lamports)?;

    // Any remaining yield is liquid-unstaked from marinade and incurs a fee
    let amount_to_liquid_unstake =
        requested_withdrawal_lamports.saturating_sub(amount_to_withdraw_from_liq_pool.lamports);

    // The amount that remains in the liquidity pool after the unstake
    // checked_sub is safe as it cannot be more than the current balance
    let actual_pool_balance_after_unstake = liq_pool_balance
        .checked_sub_lamports(amount_to_withdraw_from_liq_pool.lamports)
        .expect("actual_pool_balance_after_unstake");

    let delayed_unstake_in_flight_this_epoch = match &accounts.epoch_report_account {
        Some(epoch_report_account) => epoch_report_account.total_ordered_lamports,
        None => 0,
    };

    msg!(
        "delayed unstake in-flight {}",
        delayed_unstake_in_flight_this_epoch
    );

    // This amount should be ordered for delayed unstake to rebalance the liquidity pool to its preferred minimum
    let amount_to_order_delayed_unstake = preferred_min_liq_pool_after_unstake
        // checked_sub is appropriate, we use unwrap_or(0) to avoid a panic
        .checked_sub(actual_pool_balance_after_unstake.sol_value(&accounts.marinade_state))
        // the msol withdrawn from the liquidity pool will be sent into the msol pot, so should be discounted here
        .and_then(|pool_balance_shortfall_after_unstake| {
            pool_balance_shortfall_after_unstake.checked_sub(amount_to_withdraw_from_liq_pool.msol)
        })
        // subtract the amount that is already in flight for delayed unstake from previous liquid unstakes
        .and_then(|total_pool_balance_shortfall_after_unstake| {
            total_pool_balance_shortfall_after_unstake
                .checked_sub(delayed_unstake_in_flight_this_epoch)
        })
        .unwrap_or(0);

    msg!(
        "liq_pool_balance:{:?}\n\
        gsol_mint_supply:{:?}\n\
        preferred_min_liq_pool_after_unstake:{}\n\
        amount_to_withdraw_from_liq_pool:{:?}\n\
        amount_to_liquid_unstake:{}\n\
        actual_pool_balance_after_unstake:{:?}\n\
        delayed_unstake_in_flight_this_epoch:{}\n\
        amount_to_order_delayed_unstake:{}",
        liq_pool_balance,
        accounts.gsol_mint.supply,
        preferred_min_liq_pool_after_unstake,
        amount_to_withdraw_from_liq_pool,
        amount_to_liquid_unstake,
        actual_pool_balance_after_unstake,
        delayed_unstake_in_flight_this_epoch,
        amount_to_order_delayed_unstake
    );
    let amounts: Box<LiquidUnstakeAmounts> = Box::new(LiquidUnstakeAmounts {
        amount_to_withdraw_from_liq_pool,
        amount_to_liquid_unstake,
        amount_to_order_delayed_unstake,
    });
    Ok(amounts)
}

pub fn get_delegated_stake_amount(stake_account: &AccountInfo) -> Result<u64> {
    // Gets the active stake amount of the stake account. We need this to determine how much gSol to mint.
    let stake_state = try_from_slice_unchecked::<StakeState>(&stake_account.data.borrow())?;

    match stake_state.delegation() {
        Some(delegation) => Ok(delegation.stake),
        None => Err(crate::ErrorCode::NotDelegated.into()),
    }
}
