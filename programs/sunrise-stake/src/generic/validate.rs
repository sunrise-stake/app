use super::pool::LOOKUP_WIDTH;
use anchor_lang::prelude::*;
use solana_address_lookup_table_program::state::AddressLookupTable;

/// This requires that the accounts be passed to remaining_accounts
/// in the same order as in the lookup table and fails otherwise. 
/// We return a slice of the validated accounts for a single SPL pool.
#[allow(dead_code)]
pub fn validate<'a, 'b, 'c, 'info, T>(
    ctx: Context<'a, 'b, 'c, 'info, T>,
    index: usize,
) -> Result<()>
where
    T: Accounts<'info> + 'b,
    Validator<'info>: From<&'b T>,
{
    let end_index = index + LOOKUP_WIDTH;
    assert!(end_index < (u8::MAX as usize));

    let validator: Validator<'info> = (&*ctx.accounts).into();

    let lookup_table_data = validator.lookup_table.data.borrow();
    let lookup_table = AddressLookupTable::deserialize(&lookup_table_data)
        .map_err(|_| ErrorCode::AccountDidNotSerialize)
        .unwrap();

    let accounts_to_validate = &ctx.remaining_accounts[index..end_index];
    let lookup_addresses = &lookup_table.addresses[index..end_index];

    for (i, _) in accounts_to_validate.iter().enumerate() {
        assert_eq!(accounts_to_validate[i].key(), lookup_addresses[i])
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Validator<'info> {
    lookup_table: AccountInfo<'info>,
}
