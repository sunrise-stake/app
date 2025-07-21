# Sunrise Stake Unlock Scenarios Test Suite

This directory contains comprehensive scenario tests for the unlock flow, testing all decision points and edge cases using real mainnet data.

## Scenarios Overview

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