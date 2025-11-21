#!/bin/bash
set -e

# Navigate to workspace root
cd ..

# Debug: Show environment variables from App Runner
echo "=== Environment Variables from App Runner ==="
printenv | grep VITE_ || echo "No VITE_ variables found"
echo "NODE_ENV=$NODE_ENV"

# Fetch secrets from AWS SSM Parameter Store
echo "=== Fetching secrets from AWS SSM Parameter Store ==="
SCALEKIT_CLIENT_ID=$(aws ssm get-parameter --name "arn:aws:ssm:us-west-2:814314855241:parameter/revenue-os/prod/scalekit/client-id" --region us-west-2 --query 'Parameter.Value' --output text)
LAUNCHDARKLY_CLIENT_ID=$(aws ssm get-parameter --name "arn:aws:ssm:us-west-2:814314855241:parameter/revenue-os/prod/launchdarkly/client-side-id" --region us-west-2 --query 'Parameter.Value' --output text)

echo "Fetched SCALEKIT_CLIENT_ID: ${SCALEKIT_CLIENT_ID:0:10}..."
echo "Fetched LAUNCHDARKLY_CLIENT_ID: ${LAUNCHDARKLY_CLIENT_ID:0:10}..."

# Create .env file from environment variables set by App Runner
echo "=== Creating .env file at workspace root ==="
cat > .env << EOF
VITE_SCALEKIT_CLIENT_ID=${SCALEKIT_CLIENT_ID}
VITE_LAUNCHDARKLY_CLIENT_ID=${LAUNCHDARKLY_CLIENT_ID}
VITE_SCALEKIT_AUTH_BASE_URL=https://auth.vonlabs.ai
VITE_SCALEKIT_AUTH_AUTHORIZE_PATH=/oauth/authorize
VITE_SCALEKIT_AUTH_TOKEN_PATH=/oauth/token
VITE_SCALEKIT_AUTH_LOGOUT_PATH=
VITE_SCALEKIT_REDIRECT_URI=https://app.vonlabs.ai/callback
VITE_API_BASE_URL=https://apiv2.vonlabs.ai
VITE_PUSHER_KEY=58829a8a049e0cfc8bb6
VITE_PUSHER_CLUSTER=us3
VITE_PUSHER_AUTH_ENDPOINT=https://apiv2.vonlabs.ai/api/v1/pusher/auth
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
