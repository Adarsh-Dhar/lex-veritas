#!/bin/bash

# Test script for ICP Playground deployment
# This script helps verify that the canister is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if canister ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Canister ID required${NC}"
    echo "Usage: ./test-playground.sh <CANISTER_ID>"
    echo "Example: ./test-playground.sh rdmg6-jaaaa-aaaaa-aaadq-cai"
    exit 1
fi

CANISTER_ID=$1
IC_HOST="https://icp-api.io"

echo -e "${YELLOW}Testing ICP Playground Canister: $CANISTER_ID${NC}"
echo "IC Host: $IC_HOST"
echo ""

# Test 1: Basic canister call
echo -e "${YELLOW}Test 1: Basic canister connectivity${NC}"
if dfx canister call $CANISTER_ID getCanisterEthAddress --network ic; then
    echo -e "${GREEN}✅ Canister is responding${NC}"
else
    echo -e "${RED}❌ Canister not responding${NC}"
    exit 1
fi

# Test 2: Initialize Ethereum address
echo -e "${YELLOW}Test 2: Initialize Ethereum address${NC}"
if dfx canister call $CANISTER_ID initializeEthAddress --network ic; then
    echo -e "${GREEN}✅ Ethereum address initialization successful${NC}"
else
    echo -e "${RED}❌ Ethereum address initialization failed${NC}"
fi

# Test 3: Get Ethereum address
echo -e "${YELLOW}Test 3: Get Ethereum address${NC}"
ETH_ADDRESS=$(dfx canister call $CANISTER_ID getCanisterEthAddress --network ic --output raw | tr -d '"')
if [[ $ETH_ADDRESS == 0x* && ${#ETH_ADDRESS} -eq 42 ]]; then
    echo -e "${GREEN}✅ Valid Ethereum address: $ETH_ADDRESS${NC}"
else
    echo -e "${RED}❌ Invalid Ethereum address: $ETH_ADDRESS${NC}"
fi

# Test 4: Check balance (EVM RPC test)
echo -e "${YELLOW}Test 4: Check ETH balance (EVM RPC test)${NC}"
if dfx canister call $CANISTER_ID checkBalance --network ic; then
    echo -e "${GREEN}✅ Balance check successful${NC}"
else
    echo -e "${RED}❌ Balance check failed${NC}"
fi

# Test 5: Test user registration
echo -e "${YELLOW}Test 5: Test user registration${NC}"
if dfx canister call $CANISTER_ID registerUser "Test User" "TEST001" "Test Department" variant{ANALYST} --network ic; then
    echo -e "${GREEN}✅ User registration successful${NC}"
else
    echo -e "${RED}❌ User registration failed${NC}"
fi

# Test 6: Test case creation
echo -e "${YELLOW}Test 6: Test case creation${NC}"
if dfx canister call $CANISTER_ID createCase "TEST-2025-001" --network ic; then
    echo -e "${GREEN}✅ Case creation successful${NC}"
else
    echo -e "${RED}❌ Case creation failed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Playground testing completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your .env.local with canister ID: $CANISTER_ID"
echo "2. Start your frontend: npm run dev"
echo "3. Test the full application with real blockchain integration"
echo ""
echo "Expected behavior:"
echo "- Real IP IDs (42-character hex strings starting with 0x)"
echo "- Real transaction hashes"
echo "- Real EVM RPC calls (not mock data)"
echo "- Console should show 'Real EVM RPC' messages"
