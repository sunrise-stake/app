#!/bin/bash

# Script to run all scenario tests

echo "Running all scenario tests..."
echo "=================================="

scenarios=(
    # SPL Rebalance scenarios
    "spl-rebalance-liquid-transfer"
    # Unlock scenarios
    "unlock-recover-tickets-fails"
    "successful-update-with-nft"
    "update-nft-fallback"
    "unlock-current-with-nft"
    "unlock-current-no-nft"
)

passed=0
failed=0

for scenario in "${scenarios[@]}"; do
    echo ""
    echo "Running scenario: $scenario"
    echo "----------------------------"
    
    if cd "$scenario" && anchor test; then
        echo "✅ $scenario PASSED"
        ((passed++))
    else
        echo "❌ $scenario FAILED"
        ((failed++))
    fi
    
    cd ..
done

echo ""
echo "=================================="
echo "Test Summary:"
echo "  Passed: $passed"
echo "  Failed: $failed"
echo "  Total:  ${#scenarios[@]}"
echo "=================================="

if [ $failed -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi