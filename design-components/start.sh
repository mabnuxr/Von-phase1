#!/bin/bash
set -e

# Navigate to workspace root
cd ..

export VITE_LAUNCHDARKLY_CLIENT_ID=$(aws ssm get-parameter \
    --name /revenue-os/prod/launchdarkly/client-side-id \
    --query Parameter.Value \
    --output text)

echo "VITE_LAUNCHDARKLY_CLIENT_ID: $VITE_LAUNCHDARKLY_CLIENT_ID"

export VITE_SCALEKIT_CLIENT_ID=$(aws ssm get-parameter \
    --name /revenue-os/prod/scalekit/client-id \
    --query Parameter.Value \
    --output text)

echo "VITE_SCALEKIT_CLIENT_ID: $VITE_SCALEKIT_CLIENT_ID"

# Serve Storybook
npx serve design-components/storybook-static