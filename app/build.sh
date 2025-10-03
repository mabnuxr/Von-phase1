#!/bin/bash
set -e

# Navigate to workspace root
cd ..

# Create .env file
cat > .env << 'EOF'
VITE_SCALEKIT_CLIENT_ID=prd_skc_89676802255028999
VITE_SCALEKIT_AUTH_BASE_URL=https://auth.vonlabs.ai
VITE_SCALEKIT_AUTH_AUTHORIZE_PATH=/oauth/authorize
VITE_SCALEKIT_AUTH_TOKEN_PATH=/oauth/token
VITE_SCALEKIT_AUTH_LOGOUT_PATH=
EOF

# Show env file
cat .env

# Install dependencies
npm ci

# Build library then app
npm run build:design
npm run build:app

# Check built files
ls -la app/dist/
grep -r VITE_SCALEKIT app/dist/ || true
