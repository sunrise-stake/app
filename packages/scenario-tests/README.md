# Scenario Tests

This directory contains scenario tests that use real mainnet data to test specific edge cases and scenarios.

## Running the Tests

From the root directory:
```bash
yarn test:scenario
```

Or from this directory:
```bash
anchor test
```

## Test Organization

Each scenario test is completely isolated from the main test suite:
- Uses its own `Anchor.toml` configuration
- Loads mainnet accounts from `packages/tests/fixtures/scenario1/`
- Runs in a separate test validator instance

## Available Scenarios

### scenario1-unlock-without-nft
Tests the unlock functionality when a user has locked gSOL but doesn't own an impact NFT.
Uses real mainnet state to ensure realistic testing conditions.

## Adding New Scenarios

1. Download required mainnet accounts using:
   ```bash
   solana account <pubkey> --url <mainnet-rpc> --output json -o packages/tests/fixtures/scenarioX/account.json
   ```

2. Add the accounts to `Anchor.toml` in this directory

3. Create a new test file following the pattern of existing scenario tests

## Why Separate Directory?

Some mainnet accounts (like bSOL mint and LP mint) conflict with the test fixtures used in the main test suite.
By keeping scenario tests in a separate directory with their own configuration, we can:
- Use real mainnet data without conflicts
- Run scenario tests independently
- Maintain test isolation