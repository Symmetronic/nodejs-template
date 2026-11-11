ARG NODE_VERSION="24"

FROM mcr.microsoft.com/devcontainers/typescript-node:${NODE_VERSION}

ARG CLAUDE_CODE_VERSION="2.1.322"

ENV CLAUDE_CONFIG_DIR="/home/node/.claude"
ENV DO_NOT_TRACK="1"
ENV NPM_REGISTRY="https://registry.npmjs.org/"

USER node

RUN mkdir -p "$CLAUDE_CONFIG_DIR"
RUN npm install --global \
  "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}"
