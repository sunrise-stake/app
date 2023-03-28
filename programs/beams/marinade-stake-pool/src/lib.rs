use anchor_lang::prelude::*;

declare_id!("sbm2EQPK9SDWFykkFqUhTV1t1ng2pGgSXESoyXQ5HMF");

#[program]
pub mod marinade_stake_pool_beam {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
