# Scenario 4: Unlock Current with NFT

This scenario tests the unlock functionality when:
1. The lock account is already up to date (`updated_to_epoch` == current epoch)
2. The user has a valid impact NFT
3. No update is needed, direct unlock

## Test Flow

1. **Skip updateLockAccount** - Lock account is already current
2. **unlockGSol** - Direct unlock without any updates

## Key Characteristics

- Lock account has `updated_to_epoch` == current epoch
- Valid impact NFT accounts exist
- Tests efficiency - no unnecessary updates
- Only one transaction expected (unlock only)

## Fixture Requirements

This scenario requires modifying the lock account fixture to have:
- `updated_to_epoch` matching the current test epoch
- All other accounts remain standard

## Running the Test

```bash
anchor test
```