#!/bin/bash
# deploy-on-server.sh - Run this on Ubuntu server after git pull

set -e

echo "🚀 Deploying AuthIntegrate to Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Install dependencies if needed
if [ ! -d "node_modules" ] || [ -f "package-lock.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 2. Build
echo "🏗️  Building application..."
npm run build

# 3. Verify build
echo ""
echo "✅ Verifying build output:"
if [ -f "dist/index.js" ] && [ -f "dist/public/index.html" ]; then
    echo "   ✅ dist/index.js and dist/public/index.html present"
else
    echo "   ❌ BUILD FILES MISSING!"
    exit 1
fi

# 4. Configure PM2 if not already running
echo ""
echo "🔄 PM2 Status:"
pm2 status

# 5. Stop old process
echo ""
echo "🛑 Stopping old authintegrate process..."
pm2 stop authintegrate 2>/dev/null || echo "   (Not running)"
sleep 1

# 6. Delete old process
echo "🗑️  Cleaning old PM2 process..."
pm2 delete authintegrate 2>/dev/null || echo "   (Not in PM2)"
sleep 1

# 7. Start new process
echo ""
echo "🚀 Starting new authintegrate process..."
pm2 start dist/index.js --name authintegrate --env NODE_ENV=production

# 8. Save PM2 config
pm2 save

# 9. Show status
echo ""
echo "✅ Deployment Status:"
pm2 status

echo ""
echo "📊 Recent logs:"
pm2 logs authintegrate --lines 10 --nostream

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment complete!"
echo ""
echo "Quick checks:"
echo "  ✅ Check logs:     pm2 logs authintegrate"
echo "  ✅ Check errors:   pm2 logs authintegrate --err"
echo "  ✅ Monitor:        pm2 monit"
echo "  ✅ Restart:        pm2 restart authintegrate"
echo "  ✅ Stop:           pm2 stop authintegrate"
