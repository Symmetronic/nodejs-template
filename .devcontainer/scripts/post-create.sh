#!/bin/sh
set -e

# Create node_modules
sudo mkdir -p /workspace/node_modules
sudo chown -R node:node /workspace/node_modules

# Configure Git
git config --global --add safe.directory /workspace
git config core.fileMode false

# Install dependencies
npm ci
