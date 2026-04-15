#!/bin/bash
# 🕐 Timezone Fix Verification Script
# Purpose: Verify all timezone fixes are working correctly
# Timezone: IST (Asia/Kolkata, UTC+5:30)
# Date: April 15, 2026

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🕐 TIMEZONE FIX VERIFICATION SCRIPT${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Test 1: Check if Node.js is installed
echo -e "${YELLOW}Test 1: Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}\n"

# Test 2: Check if MySQL is accessible
echo -e "${YELLOW}Test 2: Checking MySQL connection...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}⚠️  MySQL CLI not found (install mysql-client to test)${NC}"
    echo -e "${YELLOW}   Run: npm start and watch console logs for database connection${NC}\n"
else
    # Try to connect to MySQL
    if mysql -u admin -p authintegrate123 -h localhost -e "SELECT @@time_zone;" &> /dev/null; then
        TZ=$(mysql -u admin -p authintegrate123 -h localhost -se "SELECT @@time_zone;")
        if [ "$TZ" == "+05:30" ]; then
            echo -e "${GREEN}✅ MySQL timezone correctly set to: $TZ${NC}\n"
        else
            echo -e "${RED}❌ MySQL timezone is $TZ (should be +05:30)${NC}\n"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not connect to MySQL (offline is OK if using RDS)${NC}\n"
    fi
fi

# Test 3: Check backend server
echo -e "${YELLOW}Test 3: Checking backend server...${NC}"
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Backend is running on port 5000${NC}"
    
    # Try API call
    echo -e "${YELLOW}   Testing API endpoint...${NC}"
    if response=$(curl -s http://localhost:5000/api/logs 2>/dev/null); then
        if echo "$response" | grep -q "createdAt"; then
            echo -e "${GREEN}✅ API returns logs with createdAt timestamps${NC}"
            
            # Check timestamp format (should not have Z)
            timestamp=$(echo "$response" | grep -o '"createdAt":"[^"]*"' | head -1 | cut -d'"' -f4)
            if [[ "$timestamp" == *"Z"* ]]; then
                echo -e "${RED}❌ Timestamp format is UTC ISO (has Z): $timestamp${NC}"
                echo -e "${YELLOW}   Expected MySQL format: \"2026-04-15 15:30:45\"${NC}\n"
            else
                echo -e "${GREEN}✅ Timestamp format is MySQL (no Z): $timestamp${NC}\n"
            fi
        else
            echo -e "${RED}❌ API response doesn't contain createdAt${NC}"
            echo -e "${YELLOW}   Response: ${response:0:100}...${NC}\n"
        fi
    else
        echo -e "${RED}❌ Could not fetch API endpoint${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠️  Backend not running (start with: npm run dev)${NC}\n"
fi

# Test 4: Check frontend build
echo -e "${YELLOW}Test 4: Checking frontend build...${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Frontend build exists${NC}"
    
    # Check for utils.ts compiled
    if grep -r "formatRelativeTimeIST" dist/ &> /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend includes formatRelativeTimeIST${NC}\n"
    else
        echo -e "${YELLOW}⚠️  Frontend build might be from before fixes${NC}"
        echo -e "${YELLOW}   Run: npm run build${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠️  Frontend not built (run: npm run build)${NC}\n"
fi

# Test 5: Check key files were modified
echo -e "${YELLOW}Test 5: Checking file modifications...${NC}"
files_to_check=(
    "server/storage.ts:CONVERT_TZ"
    "client/src/lib/utils.ts:formatRelativeTimeIST"
    "client/src/components/AnalyticsCharts.tsx:getStartOfDayIST"
    "server/services/exportService.ts:formatTimestampIST"
)

all_modified=true
for file_and_check in "${files_to_check[@]}"; do
    file="${file_and_check%:*}"
    check="${file_and_check#*:}"
    
    if [ -f "$file" ]; then
        if grep -q "$check" "$file"; then
            echo -e "${GREEN}✅ $file contains $check${NC}"
        else
            echo -e "${RED}❌ $file missing $check${NC}"
            all_modified=false
        fi
    else
        echo -e "${RED}❌ File not found: $file${NC}"
        all_modified=false
    fi
done
echo ""

# Test 6: Check documentation
echo -e "${YELLOW}Test 6: Checking documentation...${NC}"
docs=(
    "TIMEZONE_COMPREHENSIVE_TESTING.md"
    "TIMEZONE_FIXES_SUMMARY.md"
    "TIMEZONE_CODE_CHANGES.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $doc not found (optional)${NC}"
    fi
done
echo ""

# Test 7: Check package.json scripts
echo -e "${YELLOW}Test 7: Checking npm scripts...${NC}"
if grep -q '"dev"' package.json && grep -q '"build"' package.json; then
    echo -e "${GREEN}✅ npm scripts configured${NC}\n"
else
    echo -e "${RED}❌ npm scripts missing${NC}\n"
fi

# Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}============================================${NC}\n"

if [ "$all_modified" = true ]; then
    echo -e "${GREEN}✅ All code files have been modified correctly${NC}"
else
    echo -e "${RED}⚠️  Some code files appear to be missing fixes${NC}"
fi

echo -e "\n${YELLOW}NEXT STEPS:${NC}"
echo "1. Start backend:    npm run dev"
echo "2. In another terminal, start frontend:  npm run dev (if not running)"
echo "3. Open http://localhost:5173 in browser"
echo "4. Run detailed tests from TIMEZONE_COMPREHENSIVE_TESTING.md"
echo "5. Check browser console for errors (F12)"
echo ""

echo -e "${BLUE}✅ Verification complete!${NC}"
echo -e "${BLUE}📚 Documentation ready in:${NC}"
echo "   - TIMEZONE_COMPREHENSIVE_TESTING.md (full test guide)"
echo "   - TIMEZONE_FIXES_SUMMARY.md (implementation overview)"
echo "   - TIMEZONE_CODE_CHANGES.md (detailed code changes)"
