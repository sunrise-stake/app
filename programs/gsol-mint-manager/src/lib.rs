use anchor_lang::prelude::*;

declare_id!("sgmdmefVZeTCzNFaxaUyZxG5HvBjU8VYVc1DR151iXb");

#[program]
pub mod gsol_mint_manager {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
