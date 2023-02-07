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
    #[msg("The order unstake management account is invalid for this epoch")]
    InvalidOrderUnstakeManagementAccount,
}
