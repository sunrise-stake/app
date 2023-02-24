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
    #[msg("The source gsol account does not have the required balance to lock")]
    LockInsufficientBalance,
    #[msg("The state of the lock account does not match the state in the instruction")]
    LockAccountIncorrectState,
    #[msg("The owner of the lock account does not match the authority in the instruction")]
    LockAccountIncorrectOwner,
    #[msg("The lock token account does not match the token account in the lock account")]
    LockAccountIncorrectTokenAccount,
    #[msg("The lock account has already been locked - unlock before re-locking")]
    LockAccountAlreadyLocked,
    #[msg("The lock account has not been locked yet - lock before unlocking or updating")]
    LockAccountNotLocked,
    #[msg("The lock account must be updated to the current epoch before it can be unlocked")]
    LockAccountNotUpdated,
    #[msg("The lock account has already been updated to the current epoch. Cannot update twice in the same epoch.")]
    LockAccountAlreadyUpdated,
    #[msg("Both lookup tables are already initialized")]
    AlreadyAddedLookupTables,
    CantAddAnyMorePools,
}
