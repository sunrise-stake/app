#!/bin/bash

# Script to check mainnet Blaze validator stake accounts

MAINNET_POOL="stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"
MAINNET_VALIDATOR_LIST="1istpXjy8BM7Vd5vPfA485frrV7SRJhgq5vs3sskWmc"

echo "Fetching mainnet Blaze validator list..."

# Get first few entries from validator list (this is a simplified check)
# In reality, we'd need to properly decode the validator list structure

echo ""
echo "Let me check some known Blaze validator stake accounts on mainnet..."

# These are some example validator vote accounts that might be in the Blaze pool
# We'll derive their stake accounts and check if they exist

VALIDATORS=(
  # Some well-known mainnet validators
  "CogentC52e7kktFfWHwsqSmr8LiS1yAtfqhHcftCPcBJ"  # Cogent
  "7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2"  # Figment
)

for VOTE_ACCOUNT in "${VALIDATORS[@]}"; do
  echo ""
  echo "Checking validator: $VOTE_ACCOUNT"
  
  # Derive the stake account address
  # Using solana CLI to find PDA
  STAKE_ACCOUNT=$(solana find-program-derived-address \
    --program-id SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy \
    stake "$MAINNET_POOL" "$VOTE_ACCOUNT" 2>/dev/null | grep "Pubkey" | awk '{print $2}')
  
  if [ -n "$STAKE_ACCOUNT" ]; then
    echo "Derived stake account: $STAKE_ACCOUNT"
    
    # Check if it exists on mainnet
    solana account "$STAKE_ACCOUNT" --url mainnet-beta --output json-compact 2>&1 | \
      grep -q "AccountNotFound" && echo "✗ Not found" || echo "✓ Exists on mainnet"
  fi
done

echo ""
echo "Note: The devnet pool (azFVdH...) and validator list (aEP3DR...) are different from mainnet."
echo "Mainnet pool: stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi"
echo "Mainnet validator list: 1istpXjy8BM7Vd5vPfA485frrV7SRJhgq5vs3sskWmc"