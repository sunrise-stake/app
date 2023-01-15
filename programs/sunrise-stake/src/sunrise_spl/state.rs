use anchor_lang::prelude::*;

#[account]
pub struct SplPoolDetails {
    pub pool: Pubkey,
    pub state: Pubkey,
    pub pool_mint: Pubkey,
    pub pool_token_vault: Pubkey,
    pub bump: u8,
}

impl SplPoolDetails {
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 1;
}
