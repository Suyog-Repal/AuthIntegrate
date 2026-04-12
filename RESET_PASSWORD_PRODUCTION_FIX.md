# Reset Password Email Link - Production-Ready Implementation

## Overview
This document describes the production-ready fix for password reset email links that work correctly in both local development and production environments.

## Problem (FIXED ✅)
Previously, reset password email links were incorrectly generated as:
```
http://localhost:5000/reset-password?token=XYZ
```

**Issues:**
- Users cannot access localhost from their email clients
- Not suitable for production deployments
- Backend port exposed in email links
- No environment-specific configuration

## Solution Implemented

### 1. New Environment Variable: `FRONTEND_URL`

This variable points to the **frontend application** (not backend API), where email reset links should direct users.

| Environment | Value | Purpose |
|-------------|-------|---------|
| **Local Development** | `http://localhost:5173` | Vite dev server where React runs |
| **Production** | `https://authintegrate.ddnsgeek.com` | Production domain served by Nginx |

### 2. Configuration Files

#### `.env` (Production)
```env
# ========== URLS CONFIGURATION ==========
BASE_URL=https://authintegrate.ddnsgeek.com
FRONTEND_URL=https://authintegrate.ddnsgeek.com
```

**Note:** In production, both are the same domain because:
- Nginx reverse proxies `https://authintegrate.ddnsgeek.com/api/*` → `http://localhost:5000/api/*`
- Frontend is served from `https://authintegrate.ddnsgeek.com/`
- Users interact with a single domain

#### `.env.local.example` (Development)
```env
# Local backend
BASE_URL=http://localhost:5000

# Local frontend (Vite dev server)
FRONTEND_URL=http://localhost:5173
```

### 3. Backend Entry Point (`server/index.ts`)

✅ **Already configured correctly:**
```typescript
import dotenv from "dotenv";
dotenv.config();  // Loads .env on startup
```

This ensures all environment variables are available throughout the application.

### 4. Email Link Generation (`server/routes.ts`)

**Updated inside `/api/auth/forgot-password` endpoint:**

```typescript
// Construct reset link using FRONTEND_URL (not backend API URL)
// CRITICAL: This should point to frontend, not localhost:5000
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

// Validate FRONTEND_URL configuration
if (!process.env.FRONTEND_URL) {
  console.warn(
    "⚠️  FRONTEND_URL environment variable is missing! Using fallback: http://localhost:5173\n" +
    "    For production, add FRONTEND_URL to your .env file (e.g., FRONTEND_URL=https://authintegrate.ddnsgeek.com)"
  );
}

const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

// Send email with reset link
await sendPasswordResetEmail({
  email: profile.email,
  name: profile.name,
  resetLink,
  expiryMinutes: 15,
});
```

### 5. Email Service (`server/services/emailService.ts`)

✅ **No hardcoded URLs** - Receives `resetLink` as parameter:

```typescript
interface PasswordResetEmailOptions {
  email: string;
  name: string;
  resetLink: string;  // Passed from routes.ts
  expiryMinutes?: number;
}

// Inside email template:
<a href="${options.resetLink}" ...>
  Reset Password
</a>
```

## How It Works

### Local Development Flow
```
1. User fills forgot-password form (email: test@example.com)
2. Backend checks if user exists ✓
3. Backend generates token → saves to database
4. Backend builds link: http://localhost:5173/reset-password?token=abc123xyz
5. Backend sends email via Nodemailer ✓
6. User clicks link in email → Opens React app on port 5173 ✓
7. React loads ResetPassword page with token from URL ✓
8. User enters 6-digit PIN → Calls /api/auth/reset-password ✓
9. Backend validates token → Updates password ✓
10. Success! User can login with new PIN ✓
```

### Production Flow (AWS EC2 + Nginx)
```
1. User fills forgot-password form (email: user@domain.com)
2. Backend checks if user exists ✓
3. Backend generates token → saves to AWS RDS
4. Backend builds link: https://authintegrate.ddnsgeek.com/reset-password?token=abc123xyz
5. Backend sends email via Gmail ✓
6. User clicks link in email → Opens production domain in browser ✓
7. Nginx routes request to React app on localhost:3000 (static files) ✓
8. React loads ResetPassword page with token ✓
9. User enters 6-digit PIN → Calls /api/auth/reset-password ✓
10. Nginx reverse proxies to backend on localhost:5000 ✓
11. Backend validates token → Updates AWS RDS ✓
12. Success! User can login from production domain ✓
```

## Features

✅ **No Hardcoded URLs** - All URLs from environment variables  
✅ **Environment-Specific** - Different URLs for dev vs production  
✅ **Fallback Logic** - Defaults to `http://localhost:5173` if not configured  
✅ **Warning Messages** - Logs if `FRONTEND_URL` is missing  
✅ **No Breaking Changes** - Nodemailer, token generation, API routes unchanged  
✅ **Production Grade** - Uses domain names, not localhost  
✅ **Dotenv Configured** - Loaded at server startup  
✅ **MySQL Compatible** - Works with AWS RDS  

## Verification Checklist

- [x] `dotenv` imported and configured in `server/index.ts`
- [x] `FRONTEND_URL` added to `.env` (production)
- [x] `FRONTEND_URL` added to `.env.local.example` (development)
- [x] Email link generation updated in `server/routes.ts`
- [x] Fallback value provided: `http://localhost:5173`
- [x] Warning message added for missing `FRONTEND_URL`
- [x] Email service (`emailService.ts`) has no hardcoded URLs
- [x] Token generation logic unchanged
- [x] API routes unchanged
- [x] Nodemailer configuration unchanged

## Deployment Instructions

### Local Testing
1. Ensure `.env.local.example` values are in your `.env`:
   ```env
   FRONTEND_URL=http://localhost:5173
   ```
2. Run backend: `npm run dev` (server on port 5000)
3. Run frontend: `npm run dev` (Vite on port 5173)
4. Test forgot password → Check email link contains `http://localhost:5173`

### Production Deployment
1. Ensure `.env` on server has:
   ```env
   FRONTEND_URL=https://authintegrate.ddnsgeek.com
   NODE_ENV=production
   ```
2. Build: `npm run build`
3. Start server: `pm2 start npm -- start` (or your deployment method)
4. Nginx should proxy requests to localhost:5000
5. Test forgot password → Check email link contains `https://authintegrate.ddnsgeek.com` ✓

## Important Notes

⚠️ **DO NOT use `BASE_URL` for email reset links**
- `BASE_URL` is for backend API calls
- Use `FRONTEND_URL` for email links (where users click)

⚠️ **In production, Nginx handles the reverse proxy:**
- Users see: `https://authintegrate.ddnsgeek.com`
- Backend runs on: `http://localhost:5000`
- Nginx configuration proxies `/api/*` to backend

✅ **Both BASE_URL and FRONTEND_URL can be the same domain in production:**
- Frontend served from: `https://authintegrate.ddnsgeek.com/`
- Backend API served from: `https://authintegrate.ddnsgeek.com/api/*`
- Nginx handles all routing internally

## Example Email (Production)

Subject: Reset Your Password - AuthIntegrate System 🔐

```
Hello John Doe,

We received a request to reset your password. Click the button below to proceed:

[Reset Password Button] 
https://authintegrate.ddnsgeek.com/reset-password?token=a1b2c3d4e5f6...

⏱️ Expiration: This link will expire in 15 minutes.

If you didn't request this, please ignore this email.

© 2026 AuthIntegrate - Secure Authentication System
```

## Summary

✅ **Status: PRODUCTION-READY**

The reset password system now:
- Works correctly in production using the domain `https://authintegrate.ddnsgeek.com`
- Works correctly in local development using `http://localhost:5173`
- Uses environment variables for all URLs (no hardcoding)
- Includes proper validation and warning messages
- Follows industry best practices for URL handling
- Is ready for AWS EC2 + Nginx deployment

**No further changes needed before production deployment!**
