#!/bin/sh
set -e

prepare_node_modules() {
  sudo mkdir -p /workspace/node_modules
  sudo chown -R "${USERNAME}:${USERNAME}" /workspace/node_modules
}

install_dependencies() {
  prepare_node_modules
  npm ci
  npm run prepare
}

install_dependencies
