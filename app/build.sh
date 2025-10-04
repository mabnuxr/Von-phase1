#!/bin/bash
set -e

# Navigate to workspace root
cd ..

# Debug: Show environment variables from App Runner
echo "=== Environment Variables from App Runner ==="
printenv | grep VITE_ || echo "No VITE_ variables found"
echo "NODE_ENV=$NODE_ENV"

# Create .env file from environment variables set by App Runner
echo "=== Creating .env file at workspace root ==="
cat > .env << EOF
VITE_SCALEKIT_CLIENT_ID=prd_skc_89676802255028999
VITE_SCALEKIT_AUTH_BASE_URL=https://auth.vonlabs.ai
VITE_SCALEKIT_AUTH_AUTHORIZE_PATH=/oauth/authorize
VITE_SCALEKIT_AUTH_TOKEN_PATH=/oauth/token
VITE_SCALEKIT_AUTH_LOGOUT_PATH=/oauth/logout
VITE_SCALEKIT_REDIRECT_URI=https://app.vonlabs.ai/callback
EOF

echo "=== .env file contents ==="
cat .env

# Install dependencies
echo "=== Installing dependencies ==="
npm ci

# Build library then app
echo "=== Building design-components library ==="
npm run build:design

echo "=== Building app ==="
npm run build:app

# Check built files
echo "=== Checking built files ==="
ls -la app/dist/
echo "=== Searching for VITE variables in build ==="
grep -r VITE_SCALEKIT app/dist/ | head -10 || echo "No VITE_SCALEKIT found in build"
echo "=== Searching for client ID in build ==="
grep -r prd_skc_89676802255028999 app/dist/ | head -5 || echo "Client ID not found in build"
echo "=== Searching for redirect URI in build ==="
grep -r "app.vonlabs.ai/callback" app/dist/ | head -5 || echo "Redirect URI not found in build"
