FROM mcr.microsoft.com/devcontainers/typescript-node:24

ENV NPM_REGISTRY="https://registry.npmjs.org/"

RUN apt-get update && \
    apt-get upgrade -y

USER node

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/home/node/.local/bin:${PATH}"

RUN npm install -g @anthropic-ai/claude-code @openhands/agent-canvas
