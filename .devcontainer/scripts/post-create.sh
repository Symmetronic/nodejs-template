#!/bin/sh
set -e

# Install dependencies
sudo mkdir -p /workspace/node_modules
sudo chown -R node:node /workspace/node_modules
sudo mkdir -p /home/node/.claude /home/node/.openhands
sudo chown -R node:node /home/node/.claude /home/node/.openhands
npm ci
