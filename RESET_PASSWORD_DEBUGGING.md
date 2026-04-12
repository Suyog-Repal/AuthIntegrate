# Reset Token Error - Debugging Guide

## Error: "Invalid or expired reset token"

This guide helps you troubleshoot why you're seeing this error when trying to reset your password.

---

## What's Now Been Added

Enhanced logging has been added to trace the entire password reset flow:

### 1. **Frontend Logging** (client/src/pages/ResetPassword.tsx)
```
When page loads:
🔗 Current URL: https://authintegrate.ddnsgeek.com/reset-password?token=abc123...
📋 Extracted token from URL: abc123... (first 16 chars)

When submitting form:
📤 Sending password reset request:
   Token: abc123... (first 16 chars)
   New Password: ••••••
```

### 2. **Backend Logging** (server/routes.ts)

**On forgot-password request:**
```
✅ Password reset token generated and saved for user 5 (john@example.com)
   Token: a1b2c3d4e5f6... (first 16 chars)
   Reset link: https://authintegrate.ddnsgeek.com/reset-password?token=a1b2c3d4e5f6...
```

**On reset-password request:**
```
🔍 Attempting to reset password with token: a1b2c3d4e5f6... (first 16 chars)
✅ Token validated successfully for user: 5
✅ Password reset complete for user: 5
```

**On error:**
```
❌ Reset token validation failed for token: a1b2c3d4e5f6...
   Token may be invalid, expired, or mismatched in database
```

### 3. **Database Logging** (server/storage.ts)

**Saving token:**
```
💾 Saving reset token for user 5, expires at: 2026-04-13T15:30:45.123Z
   ✅ Token saved successfully
```

**Retrieving token:**
```
🔎 Querying database for reset token: a1b2c3d4e5f6...
   ✅ Token found! User ID: 5
```

**On token not found:**
```
🔎 Querying database for reset token: a1b2c3d4e5f6...
   ❌ Token not found or expired

   📌 If token exists but is expired:
      Expiry time: 2026-04-13T15:15:30.000Z
      Current time: 2026-04-13T15:30:45.123Z

   📌 If token doesn't exist in DB at all:
      Token does not exist in database at all
```

---

## How to Debug the Issue

### Step 1: Check Browser Console
1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Request password reset
4. Look for:
```
🔗 Current URL: [should show full URL with token]
📋 Extracted token from URL: [should show partial token]
```

**If token is NOT extracted:**
- The link is malformed - check the email link

**If token IS extracted:**
- Go to Step 2

### Step 2: Check Server Logs
1. Look at your backend server console/terminal
2. When you request password reset, you should see:
```
✅ Password reset token generated and saved for user X (email@example.com)
   Token: abc123...
```

**If you DON'T see this:**
- The forgot-password API failed silently
- Check if email service is configured correctly

**If you DO see this:**
- Go to Step 3

### Step 3: Copy the Token
1. From the server logs, copy the full token (not just first 16 chars)
2. From the email or browser URL, copy the token from the URL
3. **Compare them - they MUST match exactly**

If they don't match, there's a URL encoding issue.

### Step 4: Check Backend Console When Submitting
When you fill out the PIN and click "Reset PIN", check server logs:

**Success case:**
```
🔍 Attempting to reset password with token: a1b2c3d4e5f6...
   ✅ Token found! User ID: 5
✅ Password reset complete for user: 5
```

**Failure case:**
```
🔍 Attempting to reset password with token: a1b2c3d4e5f6...
   ❌ Token not found or expired
   📌 Token exists in DB but is expired:
      Expiry time: 2026-04-13T15:15:30.000Z
      Current time: 2026-04-13T15:30:45.123Z
```

---

## Common Causes & Solutions

### ❌ Issue 1: "Token not found or expired"

**Cause 1A: Token has actually expired**
- Tokens expire after 15 minutes
- Check the server logs for expiry time
- Solution: Request a new password reset

**Cause 1B: Token doesn't exist in database**
- The forgot-password endpoint didn't save the token
- Solution: 
  1. Check if user email exists
  2. Request password reset again
  3. Watch server logs for "Token saved successfully"

**Cause 1C: Token URL mismatch**
- The token in URL doesn't match token in database
- Possible issues:
  - URL encoding changed the token
  - Email client wrapped the link
  - Used different email client
- Solution:
  1. Copy full token from email link
  2. Check server database directly (see below)

### ❌ Issue 2: "Token not extracted from URL"

**Cause:** Browser URL doesn't contain the token
- Check if email link includes `?token=...`
- Check if FRONTEND_URL is correct in `.env`
- Solution:
  1. Verify FRONTEND_URL in `.env`
  2. Request a new password reset
  3. Check if email contains full link

###  ❌ Issue 3: "No reset token found" (frontend message)

**Cause:** Browser couldn't find `?token=` in URL
- Solution:
  1. Copy the full link from email
  2. Paste into address bar
  3. Verify URL has `?token=xxxxx` at the end

---

## Direct Database Check (Advanced)

If issues persist, manually check the database:

### Check 1: Verify columns exist
```sql
DESCRIBE user_profiles;
-- Look for: reset_token, reset_token_expiry columns
```

### Check 2: Check if token was saved
```sql
SELECT user_id, email, reset_token, reset_token_expiry 
FROM user_profiles 
WHERE email = 'your-email@example.com';
```

Expected output:
```
user_id | email                | reset_token                      | reset_token_expiry
--------|----------------------|----------------------------------|-----------------------
5       | john@example.com     | a1b2c3d4e5f6...                 | 2026-04-13 15:30:45
```

**If reset_token is NULL:**
- Token wasn't saved
- Forgot-password endpoint has an issue

**If reset_token exists but reset_token_expiry is in the past:**
- Token expired naturally (15 minutes)
- Request new password reset

### Check 3: Manually test token lookup
```sql
SELECT * FROM user_profiles 
WHERE reset_token = 'YOUR_FULL_TOKEN_HERE' 
AND reset_token_expiry > NOW();
```

**Expected:** Returns 1 row with user data

**Got 0 rows:**
- Token doesn't exist in DB
- Token has expired
- Check the timestamp in reset_token_expiry

---

## Configuration Checklist

Verify these settings are correct:

```env
# .env

# Database must be reachable
DB_HOST=authintegrate-db.c9cw2wye62zf.ap-south-1.rds.amazonaws.com
DB_USER=admin
DB_PASS=authintegrate123

# Email service must be working
EMAIL_USER=authintegrate.system@gmail.com
EMAIL_PASS=dgujbuhcabccibtn

# Frontend URL for reset links
FRONTEND_URL=https://authintegrate.ddnsgeek.com
```

---

## Next Steps If Still Not Working

If the issue persists after checking all the above:

1. **Share server logs** - Include the full output when:
   - Requesting password reset
   - Submitting the reset form

2. **Check MySQL connectivity** - Verify database is accessible:
   ```bash
   mysql -u admin -p -h authintegrate-db.c9cw2wye62zf.ap-south-1.rds.amazonaws.com -e "SELECT VERSION();"
   ```

3. **Verify migration ran** - Check if columns exist:
   ```bash
   mysql -u admin -p authintegrate -e "DESCRIBE user_profiles;" | grep reset_token
   ```

4. **Test with local database** - Switch to localhost for testing:
   - Update `.env`: `DB_HOST=localhost`
   - Run migrations: `npm run migrate`
   - Test password reset again

---

## Helpful Commands

### View all logs (backend)
```bash
# Terminal running your backend server
# Look for lines with: 🔍, 💾, ✅, ❌, 📌
```

### Check browser console
Press `F12` → Console tab → Filter by messages starting with: 🔗, 📋, 📤

### Watch database in real-time (while testing)
```bash
# Open MySQL client in another terminal
mysql -u admin -p authintegrate

# Run this query after requesting password reset:
SELECT user_id, email, reset_token, reset_token_expiry 
FROM user_profiles 
WHERE reset_token IS NOT NULL;

# Should see your token and a future expiry time
```

---

## Tests Performed

All the following have been implemented and logged:

✅ Frontend token extraction from URL
✅ Token generation in forgot-password endpoint
✅ Token storage in database with expiry time
✅ Token lookup in reset-password endpoint
✅ Database query debugging with multiple fallbacks
✅ Error messages with helpful hints
✅ Comprehensive console logging at every step

The system now provides detailed visibility into every step of the password reset process!
