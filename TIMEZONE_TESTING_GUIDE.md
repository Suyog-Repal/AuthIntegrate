# Timezone Consistency Testing Guide

## Overview
This guide verifies that all timezone inconsistencies have been fixed and the system is now 100% consistent in Mumbai time (IST - UTC+5:30).

---

## CRITICAL CHECKS

### 1. Backend Database Verification

**Check SQL Conversion:**
```sql
-- Run this in your MySQL client to verify IST conversion is working
SELECT 
    id,
    created_at AS utc_time,
    CONVERT_TZ(created_at, '+00:00', '+05:30') AS ist_time,
    TIMEDIFF(CONVERT_TZ(created_at, '+00:00', '+05:30'), created_at) AS offset
FROM access_logs
ORDER BY id DESC
LIMIT 5;
```

Expected: `TIMEDIFF` should show `05:30:00` (5 hours 30 minutes offset)

---

## FUNCTIONAL TESTS

### Test 1: Create New User & Check Registration Time

**Steps:**
1. Go to Register page
2. Create a new user with:
   - User ID: 999
   - Name: Test User
   - Email: test@example.com
   - Mobile: 9999999999
   - Password: 123456
3. Submit and check if registration succeeds
4. Go to Admin Dashboard → Users table

**Expected Results:**
- ✓ New user appears in the Users table
- ✓ Registration time shows in IST (Mumbai time)
- ✓ Timestamp format: "MMM dd, yyyy HH:mm:ss IST" (e.g., "Apr 13, 2026 15:30:45 IST")

---

### Test 2: Refresh Dashboard & Verify Data Stability

**Steps:**
1. Stay on Admin Dashboard
2. Note the total users count, total logs, and today's stats
3. Refresh page (Ctrl+R)
4. Wait for data to load
5. Compare the stats with before refresh

**Expected Results:**
- ✓ Total users count is SAME
- ✓ Total logs count is SAME
- ✓ Today's granted/denied counts are SAME
- ✓ No random data changes

**What This Tests:**
- Ensures timezone filtering is consistent
- Verifies "TODAY" calculation uses IST correctly
- Proves no timezone offset drift on refresh

---

### Test 3: Access Logs Display with Relative Time

**Steps:**
1. Go to Logs page
2. Look at the "Recent Activity" logs list
3. Check timestamps (should show relative time like "5 mins ago", "2 hours ago")
4. Hover over timestamps to see absolute time tooltip

**Expected Results:**
- ✓ Relative times are accurate (e.g., "5 mins ago" is actually ~5 minutes in IST)
- ✓ Tooltip shows absolute time in IST format
- ✓ All times are consistent with current IST time
- ✓ No timezone offset causes "5 mins ago" to actually be "35 mins ago" (5:30 hour offset issue)

**What This Tests:**
- Verifies formatRelativeTimeIST() works correctly
- Ensures no double-timezone conversion
- Confirms IST calculations are accurate

---

### Test 4: Chart Data Consistency

**Steps:**
1. Go to Admin Dashboard (scroll down to see charts)
2. Look at "Access Trend (Last 7 Days)" chart
3. Compare the data with Logs page filtered by date
4. Refresh the dashboard
5. Verify chart shows same data before and after refresh

**Expected Results:**
- ✓ Chart shows same data before and after refresh
- ✓ Chart dates align with actual log dates (in IST)
- ✓ Granted/Denied counts match the logs table
- ✓ No random fluctuations in chart data

**What This Tests:**
- Ensures chart uses API data directly (no re-conversion)
- Verifies GROUP BY is using IST timezone
- Confirms data stability across refreshes

---

### Test 5: Filter Logs by Date/Month/Year

**Steps:**
1. Go to Logs page
2. Select a specific date filter (e.g., April 13, 2026)
3. Check which logs appear
4. Go to Admin Dashboard and manually count logs for that date
5. Compare numbers

**Expected Results:**
- ✓ Logs page and Dashboard show same count for the filtered date
- ✓ Filtered date is in IST (not UTC offset)
- ✓ All displayed logs are actually from that IST date

**What This Tests:**
- Verifies DATE(CONVERT_TZ()) in backend SQL is working
- Ensures filtering uses IST, not UTC
- Prevents "off-by-one day" errors due to timezone

---

### Test 6: Export to Excel/PDF

**Steps:**
1. Go to Logs page
2. Click "Export to Excel" button
3. Download and open the Excel file
4. Check timestamps in the export
5. Check filename (should be IST date, not UTC)
6. Repeat with "Export to PDF"

**Expected Results:**
- ✓ Excel file: timestamps show IST format (e.g., "13 Apr 2026, 15:30:45 IST")
- ✓ PDF file: timestamps show IST format
- ✓ Filename format: "logs_YYYY-MM-DD.xlsx" where date is IST date
- ✓ Generated time shown in export is IST
- ✓ All exported data matches what's shown in UI

**What This Tests:**
- Verifies exportService uses IST formatting (formatTimestampIST)
- Ensures filename generation uses IST date
- Confirms export data matches displayed data

---

### Test 7: Real-Time Updates (Socket.io)

**Steps:**
1. Go to Admin Dashboard
2. Keep Live Activity section visible
3. Trigger a simulator event (if available) or wait for real hardware event
4. Watch the new log appear in real-time
5. Check the timestamp of the new log
6. Refresh the page
7. Verify the new log is still there with same timestamp

**Expected Results:**
- ✓ New log appears in real-time (via Socket.io)
- ✓ Timestamp in real-time log is IST
- ✓ Same log persists after refresh with same timestamp
- ✓ No timezone difference between real-time and refreshed view

**What This Tests:**
- Verifies Socket.io emits IST timestamps
- Ensures getRecentAccessLogs() returns IST data
- Confirms real-time and persisted data match

---

### Test 8: Time Range Filtering

**Steps:**
1. Go to Logs page
2. Use "Start Time" and "End Time" filters
3. Set range (e.g., 10:00 AM to 2:00 PM IST)
4. See which logs appear
5. Manually verify they're in the correct time range

**Expected Results:**
- ✓ Filtered logs are within the IST time range specified
- ✓ Times are NOT offset (e.g., 10:00 UTC is NOT shown when filtering for 10:00 IST)
- ✓ Time range is properly converted using TIME(CONVERT_TZ())

**What This Tests:**
- Ensures time range filtering uses IST
- Prevents timezone offset from breaking time filters
- Verifies TIME(CONVERT_TZ()) works correctly

---

## ADVANCED CHECKS

### Check 9: User Profile Display

**Steps:**
1. Go to Admin Dashboard → Users tab
2. Click on a user to view their profile
3. Check "Joined" date/time
4. Refresh and verify date is same
5. Go to user's own dashboard (if applicable) and verify registration time

**Expected Results:**
- ✓ Registration time shown in IST
- ✓ Same across all pages and after refresh
- ✓ No timezone offset issues

**What This Tests:**
- Verifies getUserWithProfile() uses CONVERT_TZ
- Ensures user profile timestamps are consistent

---

### Check 10: Statistics Cardinality

**Steps:**
1. Admin Dashboard → Stats Cards (top)
2. Note "Total Users" count
3. Manual count users by scrolling through Users list
4. Verify counts match

**Steps 2:**
1. Note "Total Access Logs" count
2. Sum up logs from Logs page (with max results increased)
3. Verify counts match

**Expected Results:**
- ✓ Total Users count is accurate
- ✓ Total Access Logs count is accurate
- ✓ No timezone-related counting errors

**What This Tests:**
- Ensures COUNT() queries are timezone-independent
- Verifies no filtering errors due to timezone

---

## EDGE CASE TESTS

### Test 11: Boundary Times (Midnight IST)

**Steps:**
1. If possible, create logs around 00:00 IST (5:30 PM UTC previous day)
2. Go to Logs page and filter by date
3. Verify logs on day boundary are correctly grouped

**Expected Results:**
- ✓ Logs show up on the correct IST date
- ✓ No off-by-one day errors
- ✓ UTC-based grouping doesn't interfere

**What This Tests:**
- Edge case for DATE(CONVERT_TZ())
- Timezone boundary handling

---

### Test 12: Same Data in Different Views

**Steps:**
1. Get data from /api/logs endpoint (via browser dev tools)
2. Get data from /api/logs/user endpoint
3. Get data from Admin Dashboard display
4. Get data from Logs page display
5. Compare timestamps across all sources

**Expected Results:**
- ✓ CreatedAt timestamps are IDENTICAL across all views
- ✓ All times are in IST format
- ✓ No conversion differences between sources

**What This Tests:**
- Ensures unified data format across backend
- Verifies no API-specific timezone handling bugs
- Confirms end-to-end consistency

---

## DEBUGGING TIPS

If any test fails, use these debugging steps:

### Enable Debug Logging
In browser console:
```javascript
// Check API response format
fetch('/api/logs?limit=1')
  .then(r => r.json())
  .then(logs => console.log("API Response:", logs[0].createdAt))
```

### Check Database Directly
```sql
SELECT 
    id, 
    created_at,
    CONVERT_TZ(created_at, '+00:00', '+05:30') AS ist_time,
    NOW() AS current_time,
    CONVERT_TZ(NOW(), '+00:00', '+05:30') AS current_ist
FROM access_logs 
ORDER BY id DESC 
LIMIT 1;
```

### Verify Browser Timezone
```javascript
// In browser console
console.log("Browser timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
// Should show your actual timezone, but backend forces IST
```

---

## ROLLBACK PLAN

If something breaks:

1. **Revert storage.ts** - Remove CONVERT_TZ() from SELECT statements
2. **Revert routes.ts** - Remove getISTDateForFilename() function
3. **Revert exportService.ts** - Revert filename generation
4. **Revert AnalyticsCharts.tsx** - Restore getISTDate() offset logic

But first, check the specific issue before rolling back!

---

## SUCCESS CRITERIA

All tests pass when:

1. ✓ Data is SAME after page refresh
2. ✓ All timestamps show IST (UTC+5:30)
3. ✓ Charts show SAME data before/after refresh
4. ✓ Filters work correctly with IST dates
5. ✓ Exports show correct IST timestamps and filenames
6. ✓ Real-time and persisted data matches
7. ✓ No timezone offset causes double-conversion
8. ✓ "TODAY" calculations use IST correctly
9. ✓ Edge cases (midnight, timezone boundaries) work
10. ✓ All data consistent across ALL views/APIs/exports

---

## NOTES

- Database stores UTC (unchanged)
- All queries use CONVERT_TZ() to return IST
- Frontend receives IST timestamps from backend
- Frontend uses `timeZone: "Asia/Kolkata"` for formatting
- No double conversion or re-interpretation of times
- Socket.io emits IST timestamps directly
- All exports use IST formatting utilities

---

## Quick Sanity Check Script

```bash
# In terminal, curl to test API
curl "http://localhost:5001/api/stats" | grep -E "accessGranted|accessDenied"

# Should show today's counts in IST, consistent across calls
curl "http://localhost:5001/api/logs?limit=1" | jq '.[0].createdAt'

# Should show IST timestamp, same on repeated calls
```
