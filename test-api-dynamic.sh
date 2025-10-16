#!/bin/bash

# Lex Veritas 2.0 API Test Script (Dynamic Version)
# This script tests all API endpoints systematically

BASE_URL="http://localhost:3000/api"
COOKIE_JAR="cookies.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name: $message"
    else
        echo -e "${YELLOW}⚠${NC} $test_name: $message"
    fi
}

# Function to make API calls and check response
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local test_name="$5"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -b "$COOKIE_JAR" \
            -c "$COOKIE_JAR" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -b "$COOKIE_JAR" \
            -c "$COOKIE_JAR" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        print_test "$test_name" "PASS" "HTTP $http_code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        print_test "$test_name" "FAIL" "Expected HTTP $expected_status, got $http_code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
    
    echo ""
}

# Function to extract ID from JSON response
extract_id() {
    local json="$1"
    echo "$json" | jq -r '.data.id // .data[0].id // empty' 2>/dev/null
}

# Clean up cookie jar
rm -f "$COOKIE_JAR"

echo "🚀 Starting Lex Veritas 2.0 API Tests (Dynamic)"
echo "==============================================="
echo ""

# Test 1: Login as analyst
echo "1. Testing Authentication"
echo "------------------------"
api_call "POST" "/auth/login" '{"email":"analyst@lexveritas.gov","password":"demo123"}' "200" "Login as analyst"

# Test 2: Get current user
user_response=$(curl -s -X GET -H "Content-Type: application/json" -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$BASE_URL/auth/me")
user_id=$(echo "$user_response" | jq -r '.data.id' 2>/dev/null)
api_call "GET" "/auth/me" "" "200" "Get current user"

# Test 3: Get all users (admin only)
api_call "GET" "/users" "" "403" "Get users without admin role"

# Test 4: Create a new case
echo "2. Testing Case Management"
echo "-------------------------"
RANDOM_CASE_NUM=$(date +%s)
case_response=$(api_call "POST" "/cases" "{\"caseNumber\":\"SF-2025-$RANDOM_CASE_NUM\",\"leadInvestigatorId\":\"$user_id\"}" "200" "Create new case")
case_id=$(echo "$case_response" | jq -r '.data.id' 2>/dev/null)

# Test 5: Get all cases
cases_response=$(curl -s -X GET -H "Content-Type: application/json" -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$BASE_URL/cases")
existing_case_id=$(echo "$cases_response" | jq -r '.data.cases[0].id' 2>/dev/null)
api_call "GET" "/cases" "" "200" "Get all cases"

# Test 6: Get specific case
api_call "GET" "/cases/$existing_case_id" "" "200" "Get specific case"

# Test 7: Get case evidence
api_call "GET" "/cases/$existing_case_id/evidence" "" "200" "Get case evidence"

# Test 8: Create evidence item
echo "3. Testing Evidence Management"
echo "-----------------------------"
# Create a simple base64 encoded test file
echo "This is a test forensic image file" | base64 > /tmp/test_file.b64
test_file_data=$(cat /tmp/test_file.b64 | tr -d '\n')

RANDOM_ITEM_NUM=$(date +%s)
evidence_response=$(api_call "POST" "/evidence" "{
    \"caseId\":\"$existing_case_id\",
    \"itemNumber\":\"$RANDOM_ITEM_NUM\",
    \"evidenceType\":\"LAPTOP_HARD_DRIVE\",
    \"description\":\"Test laptop hard drive evidence\",
    \"collectedAt\":\"2025-10-16T10:30:00Z\",
    \"location\":\"37.7749° N, 122.4194° W\",
    \"reasonForCollection\":\"Digital forensics investigation\",
    \"handlingNotes\":\"Handled with proper chain of custody\",
    \"fileData\":\"$test_file_data\",
    \"collectedById\":\"$user_id\"
}" "200" "Create evidence item")
evidence_id=$(echo "$evidence_response" | jq -r '.data.id' 2>/dev/null)

# Test 9: Get all evidence
api_call "GET" "/evidence" "" "200" "Get all evidence"

# Test 10: Get specific evidence
if [ -n "$evidence_id" ]; then
    api_call "GET" "/evidence/$evidence_id" "" "200" "Get specific evidence"
    
    # Test 11: Verify evidence
    api_call "POST" "/evidence/$evidence_id/verify" "{\"fileData\":\"$test_file_data\"}" "200" "Verify evidence integrity"
    
    # Test 12: Create custody log
    echo "4. Testing Custody Management"
    echo "----------------------------"
    # Get prosecutor user ID
    prosecutor_response=$(curl -s -X GET -H "Content-Type: application/json" -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$BASE_URL/users")
    prosecutor_id=$(echo "$prosecutor_response" | jq -r '.data.users[] | select(.email=="prosecutor@lexveritas.gov") | .id' 2>/dev/null)
    
    custody_response=$(curl -s -X POST -H "Content-Type: application/json" -b "$COOKIE_JAR" -c "$COOKIE_JAR" -d "{
        \"action\":\"TRANSFER\",
        \"toUserId\":\"$prosecutor_id\",
        \"notes\":\"Transferred to prosecutor for review\"
    }" "$BASE_URL/evidence/$evidence_id/custody-logs")
    custody_id=$(echo "$custody_response" | jq -r '.data.id' 2>/dev/null)
    api_call "POST" "/evidence/$evidence_id/custody-logs" "{
        \"action\":\"TRANSFER\",
        \"toUserId\":\"$prosecutor_id\",
        \"notes\":\"Transferred to prosecutor for review\"
    }" "200" "Create custody transfer log"
    
    # Test 13: Get custody logs for evidence
    api_call "GET" "/evidence/$evidence_id/custody-logs" "" "200" "Get custody logs for evidence"
    
    # Test 14: Get specific custody log
    if [ -n "$custody_id" ]; then
        api_call "GET" "/custody-logs/$custody_id" "" "200" "Get specific custody log"
    fi
fi

# Test 15: Get all custody logs
api_call "GET" "/custody-logs" "" "200" "Get all custody logs"

# Test 16: Login as admin
echo "5. Testing Admin Functions"
echo "-------------------------"
api_call "POST" "/auth/logout" "" "200" "Logout analyst"

api_call "POST" "/auth/login" '{"email":"admin@lexveritas.gov","password":"demo123"}' "200" "Login as admin"

# Test 17: Get all users (admin)
users_response=$(curl -s -X GET -H "Content-Type: application/json" -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$BASE_URL/users")
api_call "GET" "/users" "" "200" "Get all users (admin)"

# Test 18: Create new user
RANDOM_USER_NUM=$(date +%s)
new_user_response=$(api_call "POST" "/users" "{
    \"name\":\"Test User $RANDOM_USER_NUM\",
    \"email\":\"test$RANDOM_USER_NUM@lexveritas.gov\",
    \"password\":\"demo123\",
    \"badgeNumber\":\"SF-$RANDOM_USER_NUM\",
    \"role\":\"ANALYST\"
}" "200" "Create new user")
new_user_id=$(echo "$new_user_response" | jq -r '.data.id' 2>/dev/null)

# Test 19: Get specific user
if [ -n "$new_user_id" ]; then
    api_call "GET" "/users/$new_user_id" "" "200" "Get specific user"
    
    # Test 20: Update user
    api_call "PUT" "/users/$new_user_id" '{"name":"Updated Test User"}' "200" "Update user"
    
    # Test 21: Delete user (soft delete)
    api_call "DELETE" "/users/$new_user_id" "" "200" "Delete user"
fi

# Test 22: Logout
echo "6. Testing Logout"
echo "----------------"
api_call "POST" "/auth/logout" "" "200" "Logout admin"

# Test 23: Try to access protected route without auth
api_call "GET" "/auth/me" "" "401" "Access protected route without auth"

# Clean up
rm -f "$COOKIE_JAR" /tmp/test_file.b64

echo "🎉 API Testing Complete!"
echo "========================"
echo ""
echo "All tests have been executed. Check the results above for any failures."
echo "If all tests show ✓ PASS, the API is working correctly!"
