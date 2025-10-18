# Testing Guide for ICP Playground Deployment

## Overview
This guide helps you validate that the Lex Veritas contract is working correctly with real Story Protocol integration on ICP Playground.

## Pre-Testing Checklist

Before starting tests, verify:
- [ ] Contract deployed to ICP Playground
- [ ] Frontend configured with correct canister ID
- [ ] `isLocalDevelopment = false` in contract
- [ ] Frontend running locally (`npm run dev`)

## Test Scenarios

### Test 1: Basic Connection
**Objective**: Verify frontend can connect to playground canister

**Steps**:
1. Open browser to `http://localhost:3000`
2. Check browser console for errors
3. Verify app loads without "Canister ID not configured" errors

**Expected Result**: ✅ App loads successfully, no connection errors

**Failure Indicators**: ❌ Console shows "Canister ID not configured or invalid"

---

### Test 2: Ethereum Address Derivation
**Objective**: Verify canister can derive its Ethereum address

**Steps**:
1. Go to any page that triggers canister calls
2. Check console for Ethereum address derivation
3. Look for messages about address initialization

**Expected Result**: ✅ Real Ethereum address derived (starts with "0x", 42 characters)

**Failure Indicators**: ❌ Address is "0x0000000000000000000000000000000000000000" or derivation fails

---

### Test 3: EVM RPC Connection
**Objective**: Verify canister can connect to EVM RPC for blockchain calls

**Steps**:
1. Try to log evidence (this triggers EVM RPC calls)
2. Check console for EVM RPC responses
3. Look for balance check results

**Expected Result**: ✅ Console shows real EVM RPC responses, not "Local Development Mode"

**Failure Indicators**: ❌ Console shows "Local Development Mode" or EVM RPC errors

---

### Test 4: User Registration
**Objective**: Verify user management works with remote canister

**Steps**:
1. Go to login page
2. Register a new user with role "ANALYST"
3. Verify registration succeeds

**Expected Result**: ✅ User registered successfully, can proceed to app

**Failure Indicators**: ❌ Registration fails or user not found after creation

---

### Test 5: Case Creation
**Objective**: Verify case management works with remote canister

**Steps**:
1. Go to Cases Manager
2. Create a new case (e.g., "TEST-2025-001")
3. Verify case appears in the list

**Expected Result**: ✅ Case created and visible in cases list

**Failure Indicators**: ❌ Case creation fails or case not visible

---

### Test 6: Evidence Logging (Real Blockchain)
**Objective**: Verify real Story Protocol integration works

**Steps**:
1. Go to Intake Form
2. Fill out evidence form:
   - Case ID: Use case from Test 5
   - Item Number: "001"
   - Evidence Type: "DOCUMENT"
   - Description: "Test evidence for blockchain verification"
   - Location: "Test location"
3. Submit form
4. Check console for blockchain transaction details

**Expected Result**: ✅ 
- Real IP ID generated (starts with "0x", 42 characters)
- Real transaction hash returned
- Evidence appears in dashboard
- Console shows "Real EVM RPC" messages

**Failure Indicators**: ❌
- Mock IP ID like "0x1234567890abcdef..."
- Mock transaction hash
- Console shows "Local Development Mode"
- Story Protocol registration fails

---

### Test 7: Custody Transfer (Real Blockchain)
**Objective**: Verify custody transfers create real blockchain transactions

**Steps**:
1. Go to evidence item from Test 6
2. Transfer custody to another user
3. Check console for transaction details

**Expected Result**: ✅
- Real transaction hash generated
- Custody transfer recorded on blockchain
- Real Story Protocol transaction

**Failure Indicators**: ❌
- Mock transaction hash
- Transfer fails
- No blockchain transaction created

---

### Test 8: Balance Check
**Objective**: Verify canister can check its Ethereum balance

**Steps**:
1. Look for balance check in console
2. Or trigger balance check manually if available

**Expected Result**: ✅ Real balance returned (may be 0, but not "Local Development Mode")

**Failure Indicators**: ❌ Mock balance message or balance check fails

---

## Success Criteria

### ✅ Full Success
All tests pass with:
- Real IP IDs (42-character hex strings starting with "0x")
- Real transaction hashes
- Real EVM RPC calls
- No mock data in responses
- Console shows "Real EVM RPC" messages

### ⚠️ Partial Success
Some tests pass but:
- Mock data still appears in some responses
- EVM RPC calls work but with errors
- Blockchain integration partially working

### ❌ Failure
Tests fail with:
- Connection errors
- All mock data responses
- "Local Development Mode" messages
- Story Protocol integration not working

## Debugging

### Console Messages to Look For

**Good Messages**:
- "Real EVM RPC" (indicates production mode)
- "Ethereum address derived: 0x..."
- "Transaction confirmed with hash: 0x..."
- "IP ID extracted: 0x..."

**Bad Messages**:
- "Local Development Mode"
- "Mock data"
- "Failed to parse"
- "EVM RPC error"

### Common Issues

#### Issue: Still Getting Mock Data
**Cause**: Contract still in development mode
**Solution**: 
1. Verify `isLocalDevelopment = false` in contract
2. Redeploy contract to ICP Playground
3. Clear browser cache

#### Issue: Connection Errors
**Cause**: Wrong canister ID or network issues
**Solution**:
1. Check `.env.local` has correct canister ID
2. Verify canister is deployed and running
3. Check network connectivity

#### Issue: EVM RPC Failures
**Cause**: Story Protocol testnet issues or gas problems
**Solution**:
1. Check Story Protocol testnet status
2. Verify canister has proper permissions
3. Check gas estimation

## Story Protocol Verification

### Check IP Assets
1. Get your canister's Ethereum address from console
2. Visit Story Protocol testnet explorer
3. Search for your address
4. Verify IP assets were created

### Check Transactions
1. Look up transaction hashes from console
2. Verify transactions are confirmed
3. Check transaction details match your evidence

## Performance Expectations

### Response Times
- **User Registration**: 1-2 seconds
- **Case Creation**: 1-2 seconds
- **Evidence Logging**: 5-15 seconds (blockchain transaction)
- **Custody Transfer**: 5-15 seconds (blockchain transaction)

### Timeout Handling
- EVM RPC calls have 10-second timeout
- Transaction confirmation waits up to 60 seconds
- If timeouts occur, check network connectivity

## Cleanup

After testing:
1. Document any issues found
2. Note performance observations
3. Record any error messages
4. Consider what improvements are needed

## Next Steps

Based on test results:
- **All tests pass**: Ready for more comprehensive testing or production deployment
- **Some failures**: Address specific issues before proceeding
- **Major failures**: Review deployment process and try again
