# Scenario 2: Successful Update with NFT

This scenario tests the unlock functionality when:
1. The lock account needs to be updated (outdated `updated_to_epoch`)
2. The user has a valid impact NFT
3. All operations succeed (recoverTickets, updateLockAccount with NFT, unlock)

## Test Flow

1. **recoverTickets** - Updates the epoch report to the current epoch
2. **updateLockAccount** - Updates the lock account's yield calculations and NFT metadata
3. **unlockGSol** - Unlocks the gSOL successfully

## Key Characteristics

- Lock account has `updated_to_epoch` < current epoch
- Valid impact NFT accounts exist
- All ticket accounts are valid for recoverTickets
- Tests the "happy path" where everything works as expected

## Running the Test

```bash
anchor test
```