use anchor_lang::prelude::*;

declare_id!("sbm1g72BpYd3pPdHtwna8xogFhYLcCKdUKricTGwibF");

#[program]
pub mod marinade_liquidity_pool_beam {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
