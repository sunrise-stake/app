# Scenario 3: Update NFT Fallback

This scenario tests the unlock functionality when:
1. The lock account needs to be updated (outdated `updated_to_epoch`)
2. The user has an impact NFT that cannot be updated (burned/transferred)
3. The system falls back to `updateLockAccountWithoutNft`

## Test Flow

1. **recoverTickets** - Updates the epoch report to the current epoch
2. **updateLockAccount** - Attempts to update with NFT, catches error, falls back to without NFT
3. **unlockGSol** - Unlocks the gSOL successfully

## Key Characteristics

- Lock account has `updated_to_epoch` < current epoch
- NFT accounts exist but NFT has been moved/burned (invalid token account)
- Tests the NFT fallback mechanism in the client
- All operations should still succeed

## Fixture Requirements

This scenario requires a fixture where the NFT has been burned or transferred.
The NFT holder token account should have 0 balance or be invalid.

## Running the Test

```bash
anchor test
```