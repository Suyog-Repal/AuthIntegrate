#!/bin/bash
# build-and-deploy.sh - Local build script before deploying to server

set -e

echo "🔨 Building Full-Stack Application..."
echo ""

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Build everything
echo "🏗️  Building client (Vite) and server (esbuild)..."
npm run build

# 3. Verify build output
echo ""
echo "✅ Build Output Verification:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "dist/index.js" ]; then
    echo "✅ dist/index.js - Server bundle"
else
    echo "❌ dist/index.js - MISSING!"
    exit 1
fi

if [ -f "dist/public/index.html" ]; then
    echo "✅ dist/public/index.html - Client HTML"
else
    echo "❌ dist/public/index.html - MISSING!"
    exit 1
fi

# Count assets
ASSET_COUNT=$(find dist/public/assets -type f 2>/dev/null | wc -l)
if [ "$ASSET_COUNT" -gt 0 ]; then
    echo "✅ dist/public/assets/ - $ASSET_COUNT files"
else
    echo "⚠️  dist/public/assets/ - No files found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Build successful!"
echo ""
echo "📋 Next steps:"
echo "1. Commit changes: git add . && git commit -m 'Build for deployment'"
echo "2. Push to GitHub: git push"
echo "3. On Ubuntu server: git pull && npm run build && pm2 restart authintegrate"
echo ""
echo "Or manually copy dist/ folder to server:"
echo "   scp -r dist/ ubuntu@your-server:/home/ubuntu/AuthIntegrate/"
