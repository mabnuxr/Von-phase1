#!/bin/bash
set -e

# Navigate to workspace root
cd ..

# Debug: Show environment variables from App Runner
echo "=== Environment Variables from App Runner ==="
printenv | grep VITE_ || echo "No VITE_ variables found"
echo "NODE_ENV=$NODE_ENV"

# Check if AWS CLI is installed, install if missing
if ! command -v aws &> /dev/null; then
  echo "=== AWS CLI not found, installing ==="

  # Detect package manager and install dependencies
  if command -v yum &> /dev/null; then
    # Amazon Linux / RHEL / CentOS
    echo "Detected yum package manager"
    yum install -y curl unzip > /dev/null 2>&1
  elif command -v apt-get &> /dev/null; then
    # Debian / Ubuntu
    echo "Detected apt-get package manager"
    apt-get update -qq
    apt-get install -y -qq curl unzip > /dev/null 2>&1
  else
    echo "ERROR: No supported package manager found (yum or apt-get)"
    exit 1
  fi

  # Download and install AWS CLI v2
  curl -sS "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -q awscliv2.zip
  ./aws/install > /dev/null 2>&1

  # Cleanup
  rm -rf awscliv2.zip aws

  echo "=== AWS CLI installed successfully ==="
fi

# Verify AWS CLI installation
echo "=== AWS CLI version ==="
aws --version

# Fetch secrets from AWS SSM Parameter Store
echo "=== Fetching secrets from AWS SSM Parameter Store ==="

if ! SCALEKIT_CLIENT_ID=$(aws ssm get-parameter --name "arn:aws:ssm:us-west-2:814314855241:parameter/revenue-os/prod/scalekit/client-id" --region us-west-2 --query 'Parameter.Value' --output text); then
  echo "ERROR: Failed to fetch SCALEKIT_CLIENT_ID from AWS SSM"
  exit 1
fi

if ! SCALEKIT_ENVIRONMENT_URL=$(aws ssm get-parameter --name "arn:aws:ssm:us-west-2:814314855241:parameter/revenue-os/prod/scalekit/environment-url" --region us-west-2 --query 'Parameter.Value' --output text); then
  echo "ERROR: Failed to fetch SCALEKIT_ENVIRONMENT_URL from AWS SSM"
  exit 1
fi

if ! LAUNCHDARKLY_CLIENT_ID=$(aws ssm get-parameter --name "arn:aws:ssm:us-west-2:814314855241:parameter/revenue-os/prod/launchdarkly/client-side-id" --region us-west-2 --query 'Parameter.Value' --output text); then
  echo "ERROR: Failed to fetch LAUNCHDARKLY_CLIENT_ID from AWS SSM"
  exit 1
fi

if ! PUSHER_KEY=$(aws ssm get-parameter --name "arn:aws:ssm:us-west-2:814314855241:parameter/revenue-os/prod/pusher/key" --region us-west-2 --query 'Parameter.Value' --output text); then
  echo "ERROR: Failed to fetch PUSHER_KEY from AWS SSM"
  exit 1
fi

if ! PUSHER_CLUSTER=$(aws ssm get-parameter --name "arn:aws:ssm:us-west-2:814314855241:parameter/revenue-os/prod/pusher/cluster" --region us-west-2 --query 'Parameter.Value' --output text); then
  echo "ERROR: Failed to fetch PUSHER_CLUSTER from AWS SSM"
  exit 1
fi

echo "Fetched SCALEKIT_CLIENT_ID: ${SCALEKIT_CLIENT_ID:0:10}..."
echo "Fetched SCALEKIT_ENVIRONMENT_URL: ${SCALEKIT_ENVIRONMENT_URL:0:20}..."
echo "Fetched LAUNCHDARKLY_CLIENT_ID: ${LAUNCHDARKLY_CLIENT_ID:0:10}..."
echo "Fetched PUSHER_KEY: ${PUSHER_KEY:0:10}..."
echo "Fetched PUSHER_CLUSTER: ${PUSHER_CLUSTER}"

# Create .env file from environment variables set by App Runner
echo "=== Creating .env file at workspace root ==="
cat > .env << EOF
VITE_SCALEKIT_CLIENT_ID=${SCALEKIT_CLIENT_ID}
VITE_SCALEKIT_AUTH_BASE_URL=${SCALEKIT_ENVIRONMENT_URL}
VITE_LAUNCHDARKLY_CLIENT_ID=${LAUNCHDARKLY_CLIENT_ID}
VITE_SCALEKIT_AUTH_AUTHORIZE_PATH=/oauth/authorize
VITE_SCALEKIT_AUTH_TOKEN_PATH=/oauth/token
VITE_SCALEKIT_AUTH_LOGOUT_PATH=
VITE_SCALEKIT_REDIRECT_URI=https://app.vonlabs.ai/callback
VITE_API_BASE_URL=https://apiv2.vonlabs.ai
VITE_PUSHER_KEY=${PUSHER_KEY}
VITE_PUSHER_CLUSTER=${PUSHER_CLUSTER}
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
