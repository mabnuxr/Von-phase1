#!/bin/bash
set -e

# Navigate to workspace root
cd ..

# Install dependencies
npm ci

# Build Storybook
npm run build-storybook --workspace=design-components
