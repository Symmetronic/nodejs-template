ARG NODE_VERSION="24"

FROM mcr.microsoft.com/devcontainers/typescript-node:${NODE_VERSION}

ARG CLAUDE_CODE_VERSION="2.1.322"
ARG GITHUB_CLI_VERSION="2.103.3"
ARG USERNAME="node"

ENV USERNAME="${USERNAME}"
ENV CLAUDE_CONFIG_DIR="/home/${USERNAME}/.claude"
ENV DO_NOT_TRACK="1"
ENV NPM_REGISTRY="https://registry.npmjs.org/"

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL --output /tmp/gh.deb \
    "https://github.com/cli/cli/releases/download/v${GITHUB_CLI_VERSION}/gh_${GITHUB_CLI_VERSION}_linux_$(dpkg --print-architecture).deb" \
  && apt-get install -y --no-install-recommends /tmp/gh.deb \
  && rm /tmp/gh.deb

USER ${USERNAME}

RUN mkdir -p "$CLAUDE_CONFIG_DIR"
RUN npm install --global \
  "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}"
