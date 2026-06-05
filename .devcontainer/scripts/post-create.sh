#!/bin/sh
set -e

# Install dependencies
sudo mkdir -p /workspace/node_modules
sudo chown -R node:node /workspace/node_modules
npm ci
