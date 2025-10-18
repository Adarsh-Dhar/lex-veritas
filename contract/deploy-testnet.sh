#!/bin/bash

echo "Deploying Lex Veritas contract to IC localnet with real data..."

# Stop any running dfx processes
dfx stop

# Start local replica
dfx start --background

# Deploy the contract
dfx deploy contract_backend

echo "Contract deployed successfully!"

# Initialize Ethereum address with real derivation
echo "Initializing Ethereum address..."
dfx canister call contract_backend initializeEthAddress

# Get the derived address
echo "Getting canister Ethereum address..."
ETH_ADDRESS=$(dfx canister call contract_backend getCanisterEthAddress --output raw | tr -d '"')
echo "Ethereum Address: $ETH_ADDRESS"

# Check balance (this will now use real EVM RPC)
echo "Checking ETH balance..."
dfx canister call contract_backend checkBalance

echo ""
echo "Deployment complete!"
echo "Contract Canister ID: $(dfx canister id contract_backend)"
echo "Ethereum Address: $ETH_ADDRESS"
echo ""
echo "Note: This is using real EVM RPC integration, not mock data"
echo "The contract will interact with the actual EVM RPC canister for blockchain operations"