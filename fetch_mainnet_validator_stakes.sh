#!/bin/bash

# Script to fetch mainnet Blaze validator stake accounts for test fixtures
# Since devnet doesn't have these accounts, we'll get them from mainnet

FIXTURES_DIR="packages/tests/fixtures/blaze"
MAINNET_POOL="stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"
STAKE_POOL_PROGRAM="SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"

echo "Fetching mainnet Blaze validator stake accounts..."
echo ""

# Known mainnet validators that are likely in the Blaze pool
# These are derived from the validator vote addresses using the stake pool PDA
VALIDATORS=(
  # Format: "vote_address:stake_account_address"
  "CogentC52e7kktFfWHwsqSmr8LiS1yAtfqhHcftCPcBJ:9hFmvrnCukVPPHhXvhaqRvRJRCQc5n5e4YN2KPEHRcmX"
  "7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2:3vFfVb2nX7JbYa6mmqe1SFWfMPjVCT9c5oLTdqnB6YPJ"
  "MarinadeA1gorithmicDelegationStrategy111111:3eeGvgm3wKM2UGSmkN7NHfheJLDHdH9nnenFMcHMDDxh"
)

# Create directory if it doesn't exist
mkdir -p "$FIXTURES_DIR/validator_stakes"

for VALIDATOR_PAIR in "${VALIDATORS[@]}"; do
  IFS=':' read -r VOTE_ADDR STAKE_ADDR <<< "$VALIDATOR_PAIR"
  
  echo "Fetching stake account for validator $VOTE_ADDR..."
  echo "  Stake account: $STAKE_ADDR"
  
  # Fetch the account data
  OUTPUT_FILE="$FIXTURES_DIR/validator_stakes/${STAKE_ADDR}.json"
  
  if solana account "$STAKE_ADDR" --url mainnet-beta --output json -o "$OUTPUT_FILE" 2>/dev/null; then
    echo "  ✓ Saved to $OUTPUT_FILE"
    
    # Also create a simplified version for Anchor.toml
    echo ""
    echo "Add this to Anchor.toml under [[test.validator.account]]:"
    echo "[[test.validator.account]]"
    echo "address = \"$STAKE_ADDR\""
    echo "filename = \"$OUTPUT_FILE\""
    echo ""
  else
    echo "  ✗ Failed to fetch account"
  fi
done

echo ""
echo "Note: These are mainnet accounts being used in a test environment."
echo "The stake amounts and delegations will be from mainnet state."
echo ""
echo "To use devnet-specific accounts instead, you would need to:"
echo "1. Deploy a new stake pool on devnet"
echo "2. Create validator stake accounts"
echo "3. Delegate stake to validators"
echo "4. Update the test fixtures accordingly"