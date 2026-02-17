# Sunrise Stake Scenario Tests

This directory contains comprehensive scenario tests for various Sunrise Stake flows, testing decision points and edge cases using real mainnet data.

## Scenarios Overview

### SPL Rebalance Scenarios

These scenarios test the admin-only instructions for rebalancing funds between SPL stake pools and Marinade.

#### spl-rebalance-liquid-transfer
- **Purpose**: Test `moveSplLiquidToMarinade` instruction
- **Flow**: Directly transfer SOL value from SPL pool (bSOL) to Marinade liquidity pool (LP tokens)
- **Verifies**: State accounting updates correctly, bSOL burned, LP tokens received
- **Note**: Does not require validator stake accounts, works with fixtures

### Unlock Flow Scenarios

### Decision Points in Unlock Flow

The unlock flow has several key decision points:
1. Does the lock account need updating? (updated_to_epoch < current_epoch)
2. If updating, does recoverTickets succeed?
3. If updating, do the impact NFT accounts exist and are they valid?
4. Can the unlock proceed despite any failures?

### Test Scenarios

#### 1. unlock-recover-tickets-fails (Case E)
- **Condition**: recoverTickets fails due to missing/invalid ticket accounts
- **Behavior**: Unlock still proceeds with `stopOnFirstFailure = false`
- **Purpose**: Ensure resilience when epoch report update fails

#### 2. successful-update-with-nft (Case A)
- **Condition**: Lock account needs update, all operations succeed
- **Behavior**: recoverTickets → updateLockAccount with NFT → unlock
- **Purpose**: Test the happy path with NFT update

#### 3. update-nft-fallback (Case B)
- **Condition**: Lock account needs update, NFT update fails
- **Behavior**: Falls back to updateLockAccountWithoutNft
- **Purpose**: Test NFT fallback mechanism

#### 4. unlock-current-with-nft (Case C)
- **Condition**: Lock account already current, NFT exists
- **Behavior**: Skip update, direct unlock
- **Purpose**: Test efficiency when no update needed

#### 5. unlock-current-no-nft (Case D)
- **Condition**: Lock account already current, no NFT
- **Behavior**: Skip update, direct unlock
- **Purpose**: Test unlock without NFT when already current

## Running Tests

Run all scenarios:
```bash
cd packages/tests/scenarios
for dir in */; do
  echo "Running $dir"
  (cd "$dir" && anchor test)
done
```

Run individual scenario:
```bash
cd packages/tests/scenarios/<scenario-name>
anchor test
```

## Implementation Notes

Each scenario:
- Uses isolated mainnet account fixtures
- Has its own Anchor.toml configuration
- Tests specific paths through the unlock flow
- Verifies correct transaction ordering and results

## Fixture Management

Fixtures are stored in `packages/tests/fixtures/scenario*/` and shared across tests where appropriate.
Key accounts that vary between scenarios:
- Lock account `updated_to_epoch` value
- NFT account validity
- Ticket account states

### Admin Fixtures

For admin-only instructions (like SPL rebalance), special fixtures are used:
- `fixtures/scenarios/admin/sunrise_state_admin.json` - Sunrise state with `update_authority` set to the test wallet
- `fixtures/scenarios/admin/admin_wallet.json` - Admin wallet with SOL for transaction fees
- `fixtures/scenarios/admin/reserve_stake.json` - SPL stake pool reserve stake account
- `fixtures/scenarios/admin/validator_list.json` - SPL stake pool validator list

The admin wallet private key is stored in each scenario's `.env` file as `ADMIN_PRIVATE_KEY`.