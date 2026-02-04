#!/bin/bash
# API Testing Script
# Usage: ./scripts/test-api.sh

set -e

echo "================================"
echo "Bellor API Testing Script"
echo "================================"
echo ""

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
USER_ID=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
RESPONSE=$(curl -s ${BASE_URL}/health)
echo $RESPONSE | jq .
if echo $RESPONSE | jq -e '.status == "ok"' > /dev/null; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${RED}✗ Health check failed${NC}"
  exit 1
fi
echo ""

# Test 2: Register New User
echo "Test 2: Register New User"
echo "-------------------------"
REGISTER_DATA='{
  "email": "test_'$(date +%s)'@bellor.app",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "User"
}'

RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

echo $RESPONSE | jq .

if echo $RESPONSE | jq -e '.data.accessToken' > /dev/null; then
  TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
  USER_ID=$(echo $RESPONSE | jq -r '.data.user.id')
  echo -e "${GREEN}✓ Registration successful${NC}"
  echo "Token: ${TOKEN:0:20}..."
  echo "User ID: $USER_ID"
else
  echo -e "${RED}✗ Registration failed${NC}"
  exit 1
fi
echo ""

# Test 3: Login with Demo User
echo "Test 3: Login with Demo User"
echo "-----------------------------"
LOGIN_DATA='{
  "email": "demo_sarah@bellor.app",
  "password": "Demo123!"
}'

RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

echo $RESPONSE | jq .

if echo $RESPONSE | jq -e '.data.accessToken' > /dev/null; then
  DEMO_TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "Demo Token: ${DEMO_TOKEN:0:20}..."
else
  echo -e "${RED}✗ Login failed${NC}"
fi
echo ""

# Test 4: Get Current User
echo "Test 4: Get Current User"
echo "------------------------"
RESPONSE=$(curl -s ${BASE_URL}/auth/me \
  -H "Authorization: Bearer $TOKEN")

echo $RESPONSE | jq .

if echo $RESPONSE | jq -e '.data.email' > /dev/null; then
  echo -e "${GREEN}✓ Get current user successful${NC}"
else
  echo -e "${RED}✗ Get current user failed${NC}"
fi
echo ""

# Test 5: List Users
echo "Test 5: List Users"
echo "------------------"
RESPONSE=$(curl -s "${BASE_URL}/users?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo $RESPONSE | jq .

if echo $RESPONSE | jq -e '.data | length > 0' > /dev/null; then
  echo -e "${GREEN}✓ List users successful${NC}"
  echo "Found $(echo $RESPONSE | jq '.data | length') users"
else
  echo -e "${RED}✗ List users failed${NC}"
fi
echo ""

# Test 6: Update User Language
echo "Test 6: Update User Language"
echo "----------------------------"
LANG_DATA='{"language": "HEBREW"}'

RESPONSE=$(curl -s -X PATCH ${BASE_URL}/users/${USER_ID}/language \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$LANG_DATA")

echo $RESPONSE | jq .

if echo $RESPONSE | jq -e '.data.preferredLanguage == "HEBREW"' > /dev/null; then
  echo -e "${GREEN}✓ Language update successful${NC}"
else
  echo -e "${RED}✗ Language update failed${NC}"
fi
echo ""

# Test 7: Search Users
echo "Test 7: Search Users"
echo "--------------------"
RESPONSE=$(curl -s "${BASE_URL}/users/search?q=demo" \
  -H "Authorization: Bearer $TOKEN")

echo $RESPONSE | jq .

if echo $RESPONSE | jq -e '.data | length > 0' > /dev/null; then
  echo -e "${GREEN}✓ Search users successful${NC}"
  echo "Found $(echo $RESPONSE | jq '.data | length') users"
else
  echo -e "${RED}✗ Search users failed${NC}"
fi
echo ""

# Test 8: Logout
echo "Test 8: Logout"
echo "--------------"
RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/logout \
  -H "Authorization: Bearer $TOKEN")

echo $RESPONSE | jq .

if echo $RESPONSE | jq -e '.data.message' > /dev/null; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${RED}✗ Logout failed${NC}"
fi
echo ""

echo "================================"
echo -e "${GREEN}All tests completed!${NC}"
echo "================================"
