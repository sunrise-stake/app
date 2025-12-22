#!/bin/bash

# Script to fetch validator stake accounts from devnet for Blaze stake pool

FIXTURES_DIR="packages/tests/fixtures/blaze"
POOL_ADDRESS="azFVdHtAJN8BX3sbGAYkXvtdjdrT5U6rj9rovvUFos9"

echo "Fetching Blaze stake pool info from devnet..."

# First, let's check if we can query the stake pool program directly
echo "Checking stake pool validator list..."

# Use solana CLI to get the validator list account data
VALIDATOR_LIST="aEP3DRe8ssFXDFokXiNMo4UXLhpL7LEPVbneUsfqeaJ"

# Try to decode the validator list to find actual validator stake accounts
echo "Fetching validator list data..."
solana account "$VALIDATOR_LIST" --url devnet --output json > validator_list_raw.json

# Check if the file was created successfully
if [ -f validator_list_raw.json ]; then
    echo "✓ Fetched validator list data"
    
    # Parse the validator list to extract stake accounts
    # Note: This is a simplified approach - in practice, you'd need to properly decode the SPL stake pool validator list format
    echo ""
    echo "To find the actual validator stake accounts, we need to:"
    echo "1. Decode the validator list data using the SPL stake pool format"
    echo "2. For each validator in the list, derive the stake account address using:"
    echo "   - Seeds: [b'stake', pool_address, validator_vote_address]"
    echo "   - Program: SPL Stake Pool Program ID"
    echo ""
    echo "The validator list format includes:"
    echo "- Account type (1 byte)"
    echo "- Max validators (4 bytes)"
    echo "- List of validators, each containing:"
    echo "  - Vote account address (32 bytes)"
    echo "  - Balance (8 bytes)"
    echo "  - Score (4 bytes)"
    echo "  - Active stake lamports (8 bytes)"
    echo "  - Transient stake lamports (8 bytes)"
    echo "  - Status (1 byte)"
else
    echo "✗ Failed to fetch validator list data"
fi

# Clean up
rm -f validator_list_raw.json

echo ""
echo "Based on the test output, the derived validator stake accounts would be:"
echo "1. F7R48mo2L6Y7jZZmfPdE67WhhzQC39DVsMGb228Azd4K (for vote account 5KqWtB2W6RDJG9AUJLhASv63CVp6XcPD2FYRRfC2G9vP)"
echo "2. 5JAC7qK5STcgtf7f2GUCA1TrEsEf2rkzkHXz7vQCgJHJ (for vote account DzC4LSB23YQWt8qHDeryvPrjAgczQr9JkK9AAfvZs4tP)"
echo "3. HWbQS6gm85i9km55yN3Wj5HdGy3Zx3Mqzby34v5canij (for vote account AgWPM8u7E9uuBGFH1NbYBboKJgSKr1DxVU9y6tMZLB9H)"
echo ""
echo "However, these accounts don't exist on devnet, which suggests the test environment"
echo "is using a local setup where validator stake accounts haven't been created yet."