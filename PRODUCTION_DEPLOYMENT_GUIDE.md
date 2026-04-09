# 🚀 Full-Stack React + Express Production Deployment Guide

## ✅ Fixes Applied

### 1. **Vite Build Configuration** (`vite.config.ts`)
- ✅ Added `base: "/"` for proper asset path resolution
- ✅ Added production optimizations (minification, chunk size limits)
- ✅ Configured correct output directory (`dist/public`)

### 2. **Express Static Serving** (`server/index.ts`)
- ✅ Fixed path to use `public` subdirectory (not `../dist/public`)
- ✅ Added proper cache headers for static files
- ✅ Added proper Content-Type headers for `.js` and `.css` files
- ✅ Separated API route handling from SPA fallback
- ✅ Added safety check: catch-all doesn't serve HTML for `/api/*` routes

### 3. **Build Configuration** (`vite.config.ts`)
- ✅ Set `minify: "terser"` for production builds
- ✅ Added `sourcemap: false` for production
- ✅ Configured chunk size optimization

---

## 📋 Deployment Checklist

### Step 1: Build Locally (Your PC)

```bash
# Install dependencies (if not done)
npm install

# Build both client and server
npm run build

# Verify build output
ls -la dist/
# Should show:
# - dist/index.js (compiled server)
# - dist/public/ (compiled React app)
# - dist/public/index.html
# - dist/public/assets/
```

### Step 2: Deploy to AWS EC2

```bash
# Copy entire dist folder to server
scp -r dist/ ubuntu@your-server:/home/ubuntu/AuthIntegrate/

# Or if using git:
git push
ssh ubuntu@your-server
cd ~/AuthIntegrate
git pull
npm run build
```

### Step 3: Verify on Server

```bash
# SSH to Ubuntu server
ssh ubuntu@your-server
cd ~/AuthIntegrate

# Verify files exist
ls -la dist/public/index.html
ls -la dist/public/assets/

# If missing, rebuild on server
npm install
npm run build
```

### Step 4: Restart PM2

```bash
# Stop the previous process
pm2 stop authintegrate

# Clear old PM2 logs
pm2 logs authintegrate --lines 0

# Start fresh
pm2 start dist/index.js --name authintegrate --env NODE_ENV=production

# Save PM2 config
pm2 save

# Verify it's running
pm2 status
pm2 logs authintegrate
```

### Step 5: Verify Nginx Configuration

Your Nginx should proxy to Express on port 5000. Example `/etc/nginx/sites-enabled/authintegrate`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Express backend (port 5000)
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Important: Allow browser to handle redirects
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* ^/assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

After updating Nginx, test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Testing After Deployment

### 1. Test from Your Laptop

```bash
# Clear browser cache (Ctrl+Shift+Delete)
# Then test these routes:

# ✅ Should show login page
https://yourdomain.com/login

# ✅ Should show home page  
https://yourdomain.com/

# ✅ Login and should go to dashboard
https://yourdomain.com/dashboard/admin
https://yourdomain.com/dashboard/user

# ✅ Page refresh should NOT show blank page
# (Press F5 on dashboard)

# ✅ Check browser console for asset errors
# (Press F12 → Console tab)
```

### 2. Test API Routes

```bash
# From your laptop, test API calls
curl -X GET https://yourdomain.com/api/user/profile \
  -H "Cookie: your_session_cookie"

# Should NOT return HTML, should return JSON
```

### 3. Check Server Logs

```bash
# SSH to server
ssh ubuntu@your-server

# View PM2 logs
pm2 logs authintegrate

# Should show:
# ✅ "📁 Serving static files from: /dist/public"
# ✅ "✅ Server running on port 5000"

# Check for errors
pm2 logs authintegrate --err
```

---

## 🔍 Troubleshooting

### Problem: Blank page after login

**Cause**: Assets not loading or React app not initializing

**Solutions**:
```bash
# 1. Clear browser cache (Ctrl+Shift+Delete)
# 2. Hard refresh (Ctrl+Shift+R)
# 3. Check browser console for errors (F12 → Console)
# 4. Verify dist/public/index.html exists:
ls -la dist/public/index.html

# 5. Check PM2 logs:
pm2 logs authintegrate

# 6. Check if assets are served (should see .js and .css files):
curl https://yourdomain.com/assets/index-xxxxx.js -I
# Should return 200 OK with Content-Type: application/javascript
```

### Problem: API routes returning HTML instead of JSON

**Solutions**:
```bash
# 1. Clear PM2 and restart:
pm2 kill
pm2 start dist/index.js --name authintegrate --env NODE_ENV=production

# 2. Check if /api routes are being registered:
pm2 logs authintegrate --lines 50
# Should show initialization messages

# 3. Verify request goes to /api/* not caught by SPA:
curl -X GET https://yourdomain.com/api/user/profile -I
# Should return JSON, not HTML
```

### Problem: 404 on page refresh

**This should be FIXED** by the new catch-all route, but if not:
- Ensure Nginx is NOT caching 404 responses
- Clear PM2 cache and restart
- Verify `dist/public/index.html` exists

---

## 📦 PM2 Ecosystem Configuration (Optional)

Create `ecosystem.config.cjs` for easier management:

```js
module.exports = {
  apps: [{
    name: "authintegrate",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    instances: 1,
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "500M",
    merge_logs: true
  }]
};
```

Then use:
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 🔑 Environment Variables Checklist

Verify these are set on your server `.env`:

```bash
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://..."
SESSION_SECRET="your-secure-random-secret"

# Optional/Optional
DB_HOST=your-rds-endpoint
DIST_DIR=../dist/public  # Or just use default
```

---

## ✨ Summary of Changes

| File | Change | Why |
|------|--------|-----|
| `vite.config.ts` | Added `base: "/"` + build optimizations | Proper asset paths in production |
| `server/index.ts` | Fixed static path, added cache headers, separated API routes | Correct file serving + asset caching + API protection |
| `package.json` | Build script → includes both Vite + esbuild | Bundles both client and server together |

---

## 📞 Still Having Issues?

1. **Check all build files exist**: `ls -la dist/`
2. **Verify dist/public is not empty**: `ls -la dist/public/`
3. **Check permissions**: `chmod -R 755 dist/`
4. **Review PM2 logs**: `pm2 logs authintegrate --lines 100`
5. **Test Nginx proxy**: `curl -v http://localhost:5000/` (from server)
6. **Clear all caches**: Nginx, PM2, browser

---

Last updated: April 10, 2026
