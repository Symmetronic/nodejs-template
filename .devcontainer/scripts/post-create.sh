#!/bin/sh
set -e

# Create node_modules
sudo mkdir -p /workspace/node_modules
sudo chown -R node:node /workspace/node_modules

# Install dependencies
npm ci
