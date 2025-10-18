# ICP Playground Deployment Guide

## Overview
This guide walks you through deploying the Lex Veritas contract to ICP Playground for testing Story Protocol integration with real blockchain calls.

## Prerequisites
- Contract is configured with `isLocalDevelopment = false`
- Motoko contract compiles without errors
- Access to ICP Playground (https://playground.internetcomputer.org/)

## Step 1: Prepare the Contract

### 1.1 Verify Production Mode
Ensure the contract is in production mode:
```motoko
// In contract/src/contract_backend/main.mo, line 45
private let isLocalDevelopment = false; // ✅ Should be false
```

### 1.2 Build the Contract
```bash
cd contract
# The contract should already be compiled, but if needed:
# dfx build contract_backend
```

Verify these files exist:
- `contract_backend.wasm` (compiled contract)
- `contract_backend.did` (Candid interface)

## Step 2: Deploy to ICP Playground

### 2.1 Access ICP Playground
1. Go to https://playground.internetcomputer.org/
2. Sign in with your Internet Identity or create a new session

### 2.2 Create New Project
1. Click "Create New Project"
2. Choose "Motoko" as the language
3. Name your project "lex-veritas"

### 2.3 Upload Contract Files
1. Upload `contract_backend.wasm` as the main WASM file
2. Upload `contract_backend.did` as the Candid interface
3. Set the canister name to "contract_backend"

### 2.4 Deploy
1. Click "Deploy" to deploy your canister
2. Wait for deployment to complete
3. **Copy the generated canister ID** (you'll need this for the frontend)

## Step 3: Configure Frontend

### 3.1 Create Environment File
Create `.env.local` in the project root:
```bash
# Copy from .env.example if it exists, or create new file
cp .env.example .env.local
```

### 3.2 Update Environment Variables
Edit `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_BACKEND_CANISTER_ID=YOUR_ACTUAL_CANISTER_ID
NEXT_PUBLIC_IC_HOST=https://icp-api.io
```

Replace `YOUR_ACTUAL_CANISTER_ID` with the canister ID from step 2.4.

### 3.3 Start Frontend
```bash
npm run dev
```

## Step 4: Initialize Canister

### 4.1 Test Connection
Open your browser to `http://localhost:3000` and check the browser console for any connection errors.

### 4.2 Initialize Ethereum Address
The canister needs to derive its Ethereum address. This happens automatically when you first use the app, but you can also test it manually:

1. Go to the app
2. Try to log evidence (this will trigger the initialization)
3. Check the console for the derived Ethereum address

## Step 5: Test Story Protocol Integration

### 5.1 Register a Test User
1. Go to the login page
2. Register a new user with role "ANALYST"
3. Verify user registration succeeds

### 5.2 Create a Test Case
1. Go to Cases Manager
2. Create a new case (e.g., "TEST-2025-001")
3. Verify case creation succeeds

### 5.3 Log Evidence (Real Blockchain Call)
1. Go to Intake Form
2. Fill out evidence details:
   - Case ID: Use the case you just created
   - Item Number: "001"
   - Evidence Type: Any type
   - Description: "Test evidence for blockchain integration"
   - Location: "Test location"
3. Submit the form

**Expected Result**: 
- Real Story Protocol IP asset is created
- Real IP ID is returned (not mock data like "0x1234...")
- Real transaction hash is generated
- Evidence appears in the dashboard with real blockchain data

### 5.4 Test Custody Transfer
1. Go to the evidence item you just created
2. Transfer custody to another user
3. Verify real transaction hash is generated

## Step 6: Verify Real Blockchain Integration

### 6.1 Check for Real Data
Look for these indicators that real blockchain calls are working:

✅ **Success Indicators:**
- IP IDs start with "0x" and are 42 characters long (real Ethereum addresses)
- Transaction hashes are real (not mock data)
- Console shows "Real EVM RPC" messages (not "Local Development Mode")
- Balance check returns real values (not "0 wei (Local Development Mode)")

❌ **Failure Indicators:**
- IP IDs look like "mock-ipa-..." or "0x1234567890abcdef..."
- Console shows "Local Development Mode" messages
- All transactions return the same mock hash

### 6.2 Story Protocol Explorer
You can verify transactions on Story Protocol's testnet explorer:
- Look up your canister's Ethereum address
- Check for recent transactions
- Verify IP assets were created

## Troubleshooting

### Common Issues

#### 1. Connection Failed
**Error**: "Canister ID not configured or invalid"
**Solution**: 
- Check `.env.local` has the correct canister ID
- Restart the development server
- Verify the canister ID from ICP Playground

#### 2. EVM RPC Errors
**Error**: "Failed to parse transaction response"
**Solution**:
- Check if Story Protocol testnet is accessible
- Verify the canister has proper EVM RPC permissions
- Check console for detailed error messages

#### 3. Mock Data Still Appearing
**Error**: Still seeing mock IP IDs or transaction hashes
**Solution**:
- Verify `isLocalDevelopment = false` in the contract
- Redeploy the contract to ICP Playground
- Clear browser cache and restart frontend

#### 4. Transaction Failures
**Error**: "Story Protocol registration failed"
**Solution**:
- Check if the canister's Ethereum address has testnet ETH
- Verify Story Protocol contract address is correct
- Check gas estimation is working properly

### Debug Commands

You can test the canister directly using dfx:
```bash
# Test canister is responding
dfx canister call YOUR_CANISTER_ID getCanisterEthAddress

# Check balance
dfx canister call YOUR_CANISTER_ID checkBalance

# Initialize address
dfx canister call YOUR_CANISTER_ID initializeEthAddress
```

## Expected Timeline

- **Deployment**: 2-3 minutes
- **Frontend Setup**: 1-2 minutes  
- **Testing**: 5-10 minutes
- **Total**: 10-15 minutes

## Notes

- ICP Playground sessions last 20 minutes
- This is for testing only, not production use
- Story Protocol testnet (`story-odyssey`) is used for safe testing
- All blockchain operations are publicly verifiable
- Canister's Ethereum address may need testnet ETH for transactions

## Next Steps

After successful testing:
1. Document any issues found
2. Consider deploying to a permanent canister for longer testing
3. Implement any missing error handling based on test results
4. Prepare for mainnet deployment when ready
