# 🕐 Comprehensive Timezone Testing Guide (IST - Asia/Kolkata)

## Overview
This document provides complete testing procedures to verify that all timezone handling across the project is correct and consistent. The system uses Mumbai time (IST - Asia/Kolkata, UTC+5:30) everywhere.

---

## ✅ IMPLEMENTATION SUMMARY

### Backend Database Fixes ✓
- **DB Connection**: Set to timezone 'Asia/Kolkata' (+05:30)
- **All Queries**: Use `CONVERT_TZ(created_at, '+00:00', '+05:30')` for IST conversion
- **User Queries**: Fixed `getUser()` to include CONVERT_TZ
- **Reset Token Timestamps**: Also converted to IST for consistency
- **Stats Calculation**: "Today" filter uses IST date comparison
- **Access Log Filtering**: All date/month/year/time filters use IST
- **Socket.io Real-time**: Emits logs with IST timestamps from `getRecentAccessLogs()`

### Frontend Fixes ✓
- **Relative Time**: `formatRelativeTimeIST()` now uses IST-aware date calculations
- **Absolute Time**: `formatAbsoluteTimeIST()` formats with Asia/Kolkata timezone
- **Analytics Charts**: Date grouping uses IST date boundaries
- **Live Status**: Displays relative times with auto-updates every second
- **No Double Conversion**: Frontend does NOT apply additional timezone offsets

### Export Service Fixes ✓
- **Excel/PDF Export**: All timestamps formatted as "DD MMM YYYY, HH:MM:SS IST"
- **Filenames**: Generated using IST date (YYYY-MM-DD)
- **Report Metadata**: Generated timestamp shows IST with timezone label
- **No Conversion**: Only formats already-IST timestamps for display

---

## TEST PROCEDURES

### Test 1: Database Timezone Verification
**Objective**: Verify database returns IST timestamps

**Steps**:
1. Open database client (MySQL Workbench or terminal)
2. Run the following query:
   ```sql
   SELECT 
     @@time_zone AS 'Server Timezone',
     NOW() AS 'Current Time (Server TZ)',
     CONVERT_TZ(NOW(), '+00:00', '+05:30') AS 'Current Time (IST)',
     DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')) AS 'Today (IST)';
   ```
3. **Expected Result**:
   - Server Timezone: +05:30
   - Both timestamp columns should show the same time
   - Today should match your IST date

---

### Test 2: Backend API Response Timing
**Objective**: Verify API returns IST timestamps

**Steps**:
1. Start the backend server (npm run dev)
2. Make API request to fetch logs:
   ```bash
   curl "http://localhost:5000/api/logs"
   ```
3. Check the response JSON:
   - All `createdAt` timestamps should be IST
   - Should match browser's IST time (approximately)
   - Should NOT have "Z" suffix (that indicates UTC ISO format)

**Expected Response Format**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "result": "GRANTED",
    "createdAt": "2026-04-15 15:30:45",
    "name": "John Doe",
    "email": "john@example.com"
  }
]
```

---

### Test 3: Frontend Relative Time Display
**Objective**: Verify "time ago" feature works correctly

**Steps**:
1. Trigger a hardware access event (or simulate one via admin panel)
2. Check LiveStatus component
3. Verify relative time display updates every second
4. Hover over timestamp to see absolute time tooltip
5. Open browser console and check for any timezone errors

**Expected Behavior**:
- New events show "just now" and count up (1 sec ago, 2 secs ago, etc.)
- After ~1 minute, shows "1 min ago", then "2 mins ago", etc.
- Absolute tooltip shows: "15 Apr 2026, 15:30:45 IST" format
- No console timezone conversion errors

---

### Test 4: Today's Data Consistency
**Objective**: Verify "Today" filter is IST-aware

**Steps**:
1. Navigate to Admin Dashboard
2. Check stats card: "Access Granted Today"
3. Query database directly:
   ```sql
   SELECT COUNT(*) FROM access_logs 
   WHERE result='GRANTED' 
   AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = CURDATE();
   ```
4. Compare DB count with Dashboard number
5. Manually create access log at 11:55 PM IST
6. Refresh dashboard - count should update

**Expected Result**:
- Dashboard count matches database count
- Count includes events from 12:00 AM to 11:59 PM IST
- Does NOT include UTC midnight rollover issues

---

### Test 5: Analytics Chart Date Grouping
**Objective**: Verify charts group data by IST dates, not UTC

**Steps**:
1. Navigate to Analytics section
2. Check "Access Trend (Last 7 Days)" chart
3. Verify dates shown match IST dates
4. Create events at 11:55 PM and 12:05 AM IST on consecutive days
5. Verify they appear on separate days in chart (not grouped incorrectly)

**Expected Behavior**:
- Chart shows 7 IST dates
- Each day starts at 12:00 AM IST and ends at 11:59 PM IST
- Events near midnight appear on correct IST date
- No UTC date boundary issues

---

### Test 6: Filtering by Date
**Objective**: Verify date filter works with IST dates

**Steps**:
1. Go to Logs page
2. Use date filter to select: 2026-04-15 (IST date)
3. Check logs returned
4. Verify in database:
   ```sql
   SELECT COUNT(*) FROM access_logs
   WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = '2026-04-15';
   ```
5. Compare counts

**Expected Result**:
- Frontend count matches database count
- Only logs from 2026-04-15 00:00:00 to 23:59:59 IST are shown
- No logs from adjacent UTC dates leak in

---

### Test 7: Filtering by Month/Year
**Objective**: Verify month and year filters use IST

**Steps**:
1. Go to Logs page
2. Filter by Month: April, Year: 2026
3. Check results
4. Verify in database:
   ```sql
   SELECT COUNT(*) FROM access_logs
   WHERE MONTH(CONVERT_TZ(created_at, '+00:00', '+05:30')) = 4
   AND YEAR(CONVERT_TZ(created_at, '+00:00', '+05:30')) = 2026;
   ```

**Expected Result**:
- Frontend count matches database filtered count
- All April 2026 events (IST) are included

---

### Test 8: Time Range Filtering
**Objective**: Verify time-of-day filtering uses IST

**Steps**:
1. Go to Logs page (if available)
2. Filter by time range: 10:00 AM to 12:00 PM IST
3. Verify results match IST times

**Expected Result**:
- Only logs created between 10:00 and 12:00 IST shown
- Respects IST timezone, not UTC or browser local

---

### Test 9: PDF/Excel Export
**Objective**: Verify exported files use IST timestamps

**Steps**:
1. Go to Logs page
2. Click "Export to Excel"
3. Open downloaded file in Excel/Sheets
4. Check timestamp column format
5. Repeat for PDF export

**Expected Format in Exports**:
- Timestamp column: "15 Apr 2026, 15:30:45 IST"
- Filename includes IST date: "logs_2026-04-15.xlsx"
- Report timestamp (in PDF): "Generated: 15 Apr 2026, 16:45:23 IST"

---

### Test 10: Real-time Socket.io Updates
**Objective**: Verify live updates use correct IST timestamps

**Steps**:
1. Open browser DevTools → Network → WS (WebSockets)
2. Navigate to Admin Dashboard
3. Trigger a hardware access event
4. In DevTools, watch the socket message:
   ```json
   {
     "event": "new-log",
     "data": {
       "id": 15,
       "userId": 5,
       "createdAt": "2026-04-15 15:30:45",
       ...
     }
   }
   ```
5. Verify timestamp appears in LiveStatus immediately and correctly

**Expected Result**:
- Socket message contains IST timestamp
- Timestamp matches database entry
- "time ago" calculation is accurate from reception time

---

### Test 11: Timezone Consistency After Refresh
**Objective**: Verify data doesn't change after page refresh

**Steps**:
1. Navigate to Admin Dashboard
2. Note down:
   - Access Granted Today count
   - Latest log timestamp
   - Chart data for today
3. Wait 10 seconds
4. Refresh page (F5)
5. Compare all values

**Expected Result**:
- All values remain identical
- No "tomorrow/yesterday" issues after refresh
- Charts don't shift or change
- Data is stable and consistent

---

### Test 12: Browser Local Timezone Isolation
**Objective**: Verify frontend doesn't use browser local timezone

**Steps**:
1. Change system timezone to a different timezone (e.g., UTC or PST)
2. Restart browser
3. Reload application
4. Check timestamps displayed

**Expected Result**:
- ALL timestamps still display in IST
- Browser timezone change has NO effect
- Application always shows Mumbai time regardless of browser settings

---

## ✅ CRITICAL VALIDATION CHECKLIST

After implementing all fixes, verify:

- [ ] Database is set to timezone 'Asia/Kolkata' (+05:30)
- [ ] All SELECT queries use `CONVERT_TZ(created_at, '+00:00', '+05:30') AS created_at`
- [ ] API endpoints return IST timestamps, never raw UTC
- [ ] Frontend formatters use `toLocaleString(..., {timeZone: 'Asia/Kolkata'})`
- [ ] Relative time calculations use IST-aware dates
- [ ] Analytics charts group by IST dates, not UTC dates
- [ ] Today's stats use `DATE(CONVERT_TZ(..., '+00:00', '+05:30'))`
- [ ] Exports format timestamps as "DD MMM YYYY, HH:MM:SS IST"
- [ ] Socket.io emits IST timestamps from `getRecentAccessLogs()`
- [ ] Date filters use IST date comparisons
- [ ] Time range filters use IST time comparisons
- [ ] All data remains consistent after page refresh
- [ ] Browser timezone changes don't affect display
- [ ] No zombie UTC timestamps in any response

---

## 🐛 DEBUGGING

### If Timestamps Are Wrong:

1. **Check database timezone**:
   ```sql
   SELECT @@time_zone;
   ```
   Should return: `+05:30`

2. **Check query CONVERT_TZ**:
   ```sql
   SELECT 
     created_at,
     CONVERT_TZ(created_at, '+00:00', '+05:30') AS created_at_ist
   FROM access_logs LIMIT 1;
   ```
   Should show IST timestamp in second column

3. **Check API response**:
   ```bash
   curl http://localhost:5000/api/logs | head -c 500
   ```
   Should show IST format like "2026-04-15 15:30:45"

4. **Check frontend calculation**:
   ```javascript
   // In browser console
   new Date("2026-04-15 15:30:45").toLocaleString("en-US", {
     timeZone: "Asia/Kolkata",
     hour12: false
   })
   // Should show 15:30:45 or close to it
   ```

5. **Check Socket.io message**:
   Open Network tab → WS → Look at message payload
   Should contain IST timestamp

---

## 📞 SUPPORT

If timezone issues persist:
1. Check server logs for CONVERT_TZ errors
2. Verify database user permissions (can execute CONVERT_TZ?)
3. Ensure all queries have been updated (grep for plain created_at)
4. Check for any hardcoded date strings in code
5. Review browser console for JavaScript timezone errors

---

## 🎯 SUCCESS CRITERIA

All of the following must be true:
- ✅ Same timestamps before/after refresh
- ✅ Same timestamps across dashboard, logs, charts, exports
- ✅ "Today" data matches IST date, not UTC date
- ✅ "Time ago" updates every second with correct calculation
- ✅ Analytics match actual data
- ✅ Exports show IST timestamps clearly labeled
- ✅ Browser timezone changes have no effect
- ✅ zero timezone-related bugs in production
