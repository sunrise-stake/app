use anchor_lang::prelude::*;

declare_id!("sbm34B5emb8AYFSsuUL9h24f6dGVyjLP39ehELjxd6D");

#[program]
pub mod spl_stake_pool_beam {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
