#!/bin/bash
set -e

# Navigate to workspace root
cd ..

# Serve Storybook
npx serve design-components/storybook-static
