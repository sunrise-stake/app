use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("An error occurred when calculating an MSol value")]
    CalculationFailure,
    #[msg("Stake account deposit must be delegated")]
    NotDelegated,
    #[msg("Wrong update authority for Sunrise state")]
    InvalidUpdateAuthority,
    #[msg("Invalid Program Account")]
    InvalidProgramAccount,
    #[msg("Invalid Mint")]
    InvalidMint,
    #[msg("Unexpected Accounts")]
    UnexpectedAccounts,
    #[msg("Unexpected gsol mint supply")]
    UnexpectedMintSupply,
    #[msg("The epoch report account is not yet updated to the current epoch")]
    InvalidEpochReportAccount,
    #[msg("Delayed unstake tickets for the current epoch can not yet be claimed")]
    DelayedUnstakeTicketsNotYetClaimable,
    #[msg("The amount of delayed unstake tickets requested to be recovered exceeds the amount in the report")]
    TooManyTicketsClaimed,
    #[msg("The total ordered ticket amount exceeds the amount in all found tickets")]
    RemainingUnclaimableTicketAmount,
}
