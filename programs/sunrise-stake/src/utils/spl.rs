use anchor_lang::prelude::*;
use anchor_lang::solana_program::borsh0_10::try_from_slice_unchecked;

/// Fee structure matching the spl-stake-pool Fee type
#[derive(Clone, Copy, Debug, Default, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct Fee {
    /// Denominator of the fee ratio
    pub denominator: u64,
    /// Numerator of the fee ratio
    pub numerator: u64,
}

/// StakePool struct matching the spl-stake-pool StakePool account structure
/// This is a simplified version with only the fields we need
#[derive(Clone, Debug, Default, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct StakePool {
    pub account_type: u8,
    pub manager: Pubkey,
    pub staker: Pubkey,
    pub stake_deposit_authority: Pubkey,
    pub stake_withdraw_bump_seed: u8,
    pub validator_list: Pubkey,
    pub reserve_stake: Pubkey,
    pub pool_mint: Pubkey,
    pub manager_fee_account: Pubkey,
    pub token_program_id: Pubkey,
    pub total_lamports: u64,
    pub pool_token_supply: u64,
    pub last_update_epoch: u64,
    pub lockup: Lockup,
    pub epoch_fee: Fee,
    pub next_epoch_fee: Option<Fee>,
    pub preferred_deposit_validator_vote_address: Option<Pubkey>,
    pub preferred_withdraw_validator_vote_address: Option<Pubkey>,
    pub stake_deposit_fee: Fee,
    pub stake_withdrawal_fee: Fee,
    pub next_stake_withdrawal_fee: Option<Fee>,
    pub stake_referral_fee: u8,
    pub sol_deposit_authority: Option<Pubkey>,
    pub sol_deposit_fee: Fee,
    pub sol_referral_fee: u8,
    pub sol_withdraw_authority: Option<Pubkey>,
    pub sol_withdrawal_fee: Fee,
    pub next_sol_withdrawal_fee: Option<Fee>,
    pub last_epoch_pool_token_supply: u64,
    pub last_epoch_total_lamports: u64,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct Lockup {
    pub unix_timestamp: i64,
    pub epoch: u64,
    pub custodian: Pubkey,
}

impl Fee {
    /// Apply the fee to the given amount
    pub fn apply(&self, amount: u64) -> Option<u128> {
        if self.denominator == 0 {
            return Some(amount as u128);
        }
        (amount as u128)
            .checked_mul(self.numerator as u128)?
            .checked_div(self.denominator as u128)
    }
}

pub fn deserialize_spl_stake_pool(stake_pool_account: &AccountInfo) -> Result<StakePool> {
    try_from_slice_unchecked::<StakePool>(&stake_pool_account.data.borrow())
        .map_err(|_| ErrorCode::AccountDidNotDeserialize.into())
}

/// Calculate lamports amount on withdrawal
#[inline]
pub fn calc_lamports_withdraw_amount(stake_pool: &StakePool, pool_tokens: u64) -> Option<u64> {
    let numerator = (pool_tokens as u128).checked_mul(stake_pool.total_lamports as u128)?;
    let denominator = stake_pool.pool_token_supply as u128;
    if numerator < denominator || denominator == 0 {
        Some(0)
    } else {
        u64::try_from(numerator.checked_div(denominator)?).ok()
    }
}

pub fn calc_lamports_from_bsol_amount(stake_pool: &StakePool, bsol_balance: u64) -> Result<u64> {
    Ok(calc_lamports_withdraw_amount(stake_pool, bsol_balance).unwrap())
}

/// Calculate pool tokens for a deposit amount
#[inline]
pub fn calc_pool_tokens_for_deposit(stake_pool: &StakePool, stake_lamports: u64) -> Option<u64> {
    if stake_pool.total_lamports == 0 || stake_pool.pool_token_supply == 0 {
        return Some(stake_lamports);
    }
    u64::try_from(
        (stake_lamports as u128)
            .checked_mul(stake_pool.pool_token_supply as u128)?
            .checked_div(stake_pool.total_lamports as u128)?,
    )
    .ok()
}

pub fn calc_bsol_from_lamports(stake_pool: &StakePool, lamports: u64) -> Result<u64> {
    Ok(calc_pool_tokens_for_deposit(stake_pool, lamports).unwrap())
}

/// Calculate stake withdrawal fee in pool tokens
#[inline]
pub fn calc_pool_tokens_stake_withdrawal_fee(
    stake_pool: &StakePool,
    pool_tokens: u64,
) -> Option<u64> {
    // Create a Fee struct from the stake_withdrawal_fee fields
    let fee = Fee {
        denominator: stake_pool.stake_withdrawal_fee.denominator,
        numerator: stake_pool.stake_withdrawal_fee.numerator,
    };
    u64::try_from(fee.apply(pool_tokens)?).ok()
}

#[allow(dead_code)]
pub fn calc_blaze_sol_withdrawal_fee(stake_pool: &StakePool, pool_tokens: u64) -> Result<u64> {
    Ok(calc_pool_tokens_stake_withdrawal_fee(stake_pool, pool_tokens).unwrap())
}

#[allow(dead_code)]
pub fn calc_blaze_stake_withdrawal_fee(stake_pool: &StakePool, pool_tokens: u64) -> Result<u64> {
    Ok(calc_pool_tokens_stake_withdrawal_fee(stake_pool, pool_tokens).unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_stake_pool(total_lamports: u64, pool_token_supply: u64) -> StakePool {
        StakePool {
            account_type: 1,
            manager: Pubkey::default(),
            staker: Pubkey::default(),
            stake_deposit_authority: Pubkey::default(),
            stake_withdraw_bump_seed: 255,
            validator_list: Pubkey::default(),
            reserve_stake: Pubkey::default(),
            pool_mint: Pubkey::default(),
            manager_fee_account: Pubkey::default(),
            token_program_id: Pubkey::default(),
            total_lamports,
            pool_token_supply,
            last_update_epoch: 0,
            lockup: Lockup::default(),
            epoch_fee: Fee {
                denominator: 0,
                numerator: 0,
            },
            next_epoch_fee: None,
            preferred_deposit_validator_vote_address: None,
            preferred_withdraw_validator_vote_address: None,
            stake_deposit_fee: Fee {
                denominator: 0,
                numerator: 0,
            },
            stake_withdrawal_fee: Fee {
                denominator: 1000,
                numerator: 3,
            }, // 0.3% fee
            next_stake_withdrawal_fee: None,
            stake_referral_fee: 0,
            sol_deposit_authority: None,
            sol_deposit_fee: Fee {
                denominator: 0,
                numerator: 0,
            },
            sol_referral_fee: 0,
            sol_withdraw_authority: None,
            sol_withdrawal_fee: Fee {
                denominator: 1000,
                numerator: 3,
            }, // 0.3% fee
            next_sol_withdrawal_fee: None,
            last_epoch_pool_token_supply: 0,
            last_epoch_total_lamports: 0,
        }
    }

    mod fee_tests {
        use super::*;

        #[test]
        fn test_fee_apply_zero_denominator() {
            let fee = Fee {
                denominator: 0,
                numerator: 1,
            };
            assert_eq!(fee.apply(1000), Some(1000));
        }

        #[test]
        fn test_fee_apply_normal() {
            // 0.3% fee = 3/1000
            let fee = Fee {
                denominator: 1000,
                numerator: 3,
            };
            // 1000 * 3 / 1000 = 3
            assert_eq!(fee.apply(1000), Some(3));
        }

        #[test]
        fn test_fee_apply_large_amount() {
            let fee = Fee {
                denominator: 1000,
                numerator: 3,
            };
            // 1_000_000_000 * 3 / 1000 = 3_000_000
            assert_eq!(fee.apply(1_000_000_000), Some(3_000_000));
        }

        #[test]
        fn test_fee_apply_100_percent() {
            let fee = Fee {
                denominator: 100,
                numerator: 100,
            };
            assert_eq!(fee.apply(500), Some(500));
        }
    }

    mod calc_pool_tokens_tests {
        use super::*;

        #[test]
        fn test_calc_pool_tokens_1_to_1_ratio() {
            // When total_lamports == pool_token_supply, ratio is 1:1
            let pool = create_test_stake_pool(1_000_000_000, 1_000_000_000);
            assert_eq!(calc_pool_tokens_for_deposit(&pool, 100), Some(100));
        }

        #[test]
        fn test_calc_pool_tokens_2_to_1_ratio() {
            // When total_lamports is 2x pool_token_supply
            // 1 lamport = 0.5 pool tokens
            let pool = create_test_stake_pool(2_000_000_000, 1_000_000_000);
            assert_eq!(calc_pool_tokens_for_deposit(&pool, 100), Some(50));
        }

        #[test]
        fn test_calc_pool_tokens_empty_pool() {
            // Empty pool should return same amount (1:1)
            let pool = create_test_stake_pool(0, 0);
            assert_eq!(calc_pool_tokens_for_deposit(&pool, 100), Some(100));
        }

        #[test]
        fn test_calc_pool_tokens_large_deposit() {
            let pool = create_test_stake_pool(100_000_000_000, 100_000_000_000);
            assert_eq!(
                calc_pool_tokens_for_deposit(&pool, 10_000_000_000),
                Some(10_000_000_000)
            );
        }
    }

    mod calc_lamports_withdraw_tests {
        use super::*;

        #[test]
        fn test_calc_lamports_1_to_1_ratio() {
            let pool = create_test_stake_pool(1_000_000_000, 1_000_000_000);
            assert_eq!(calc_lamports_withdraw_amount(&pool, 100), Some(100));
        }

        #[test]
        fn test_calc_lamports_2_to_1_ratio() {
            // When total_lamports is 2x pool_token_supply
            // 1 pool token = 2 lamports
            let pool = create_test_stake_pool(2_000_000_000, 1_000_000_000);
            assert_eq!(calc_lamports_withdraw_amount(&pool, 100), Some(200));
        }

        #[test]
        fn test_calc_lamports_empty_pool() {
            let pool = create_test_stake_pool(0, 0);
            // With 0 supply, should return 0
            assert_eq!(calc_lamports_withdraw_amount(&pool, 100), Some(0));
        }

        #[test]
        fn test_calc_lamports_small_amount() {
            let pool = create_test_stake_pool(1_000_000_000, 1_000_000_000);
            assert_eq!(calc_lamports_withdraw_amount(&pool, 1), Some(1));
        }
    }

    mod withdrawal_fee_tests {
        use super::*;

        #[test]
        fn test_calc_withdrawal_fee_normal() {
            // 0.3% fee on 1000 tokens = 3
            let pool = create_test_stake_pool(1_000_000_000, 1_000_000_000);
            assert_eq!(calc_pool_tokens_stake_withdrawal_fee(&pool, 1000), Some(3));
        }

        #[test]
        fn test_calc_withdrawal_fee_1_sol() {
            // 0.3% fee on 1 SOL (1_000_000_000 lamports) = 3_000_000
            let pool = create_test_stake_pool(1_000_000_000, 1_000_000_000);
            assert_eq!(
                calc_pool_tokens_stake_withdrawal_fee(&pool, 1_000_000_000),
                Some(3_000_000)
            );
        }

        #[test]
        fn test_calc_withdrawal_fee_small_amount() {
            // 0.3% fee on 100 = 0 (rounds down)
            let pool = create_test_stake_pool(1_000_000_000, 1_000_000_000);
            assert_eq!(calc_pool_tokens_stake_withdrawal_fee(&pool, 100), Some(0));
        }
    }

    mod integration_tests {
        use super::*;

        #[test]
        fn test_deposit_withdraw_roundtrip() {
            // Deposit 1 SOL, then withdraw - should get same amount back (ignoring fees)
            let pool = create_test_stake_pool(100_000_000_000, 100_000_000_000);

            let deposit_lamports = 1_000_000_000u64;
            let pool_tokens = calc_pool_tokens_for_deposit(&pool, deposit_lamports).unwrap();
            let withdraw_lamports = calc_lamports_withdraw_amount(&pool, pool_tokens).unwrap();

            assert_eq!(deposit_lamports, withdraw_lamports);
        }

        #[test]
        fn test_pool_token_value_increases() {
            // Simulate pool earning rewards (total_lamports increases, supply stays same)
            let initial_pool = create_test_stake_pool(100_000_000_000, 100_000_000_000);

            // After rewards, pool has 110 SOL but same supply
            let rewarded_pool = create_test_stake_pool(110_000_000_000, 100_000_000_000);

            let tokens = 1_000_000_000u64;
            let initial_value = calc_lamports_withdraw_amount(&initial_pool, tokens).unwrap();
            let rewarded_value = calc_lamports_withdraw_amount(&rewarded_pool, tokens).unwrap();

            // Pool tokens should be worth more after rewards
            assert!(rewarded_value > initial_value);
            assert_eq!(initial_value, 1_000_000_000); // 1 SOL
            assert_eq!(rewarded_value, 1_100_000_000); // 1.1 SOL
        }
    }
}
