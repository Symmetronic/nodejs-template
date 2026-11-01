#!/bin/sh
set -e

# Serve Agent Canvas on all interfaces so it can be reached from the local network.
# Public mode keeps the API key out of the served HTML; paste it into the UI once per device.
KEY_FILE="$HOME/.openhands/canvas-api-key"
LOG_FILE="$HOME/.openhands/agent-canvas.log"
LOCK_FILE="$HOME/.openhands/agent-canvas.lock"

# Lifecycle commands don't load ~/.profile, so uv/uvx would be missing from PATH.
export PATH="$HOME/.local/bin:$PATH"

mkdir -p "$HOME/.openhands"

# The supervisor inherits fd 9 and holds the lock for its lifetime, so repeated starts
# (post-start, post-attach) are no-ops.
exec 9> "$LOCK_FILE"
if ! flock -n 9 || curl -s -o /dev/null http://127.0.0.1:8100/; then
  echo "Agent Canvas is already running"
  exit 0
fi

if [ ! -s "$KEY_FILE" ]; then
  node -e "console.log(require('crypto').randomBytes(24).toString('hex'))" > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
fi

# Restart Agent Canvas whenever it exits.
LOCAL_BACKEND_API_KEY="$(cat "$KEY_FILE")" nohup setsid sh -c '
  while :; do
    echo "[supervisor] $(date -Is) starting agent-canvas"
    agent-canvas --host 0.0.0.0 --port 8100 --public 9>&- && code=0 || code=$?
    echo "[supervisor] $(date -Is) agent-canvas exited with code $code, restarting in 5s"
    sleep 5 9>&-
  done
' > "$LOG_FILE" 2>&1 < /dev/null &
echo "Agent Canvas starting on port 8100, ready in about a minute (log: $LOG_FILE, key: $KEY_FILE)"
